/**
 * Turns validated AI results into (1) a preview/PDF document and (2) a saved
 * entity, reusing each feature's own mappers so generated content follows the
 * exact same rules (nutrition, costing, slugs) as manual input.
 */
import type {
  AiArticle,
  AiCard,
  AiGenerationType,
  AiHaccp,
  AiMenu,
  AiRecipe,
  AiResult,
  AiSuggestions,
  AiTechnicalSheet,
} from '@ai-contract';
import type { ArticleKind } from '@/features/articles/api';
import { saveCard } from '@/features/cards/api';
import { cardPayloadFromAi } from '@/features/cards/schema';
import { computeAggregates, ingredientFromRow } from '@/features/culinary/schema';
import type { PdfDocument } from '@/features/export/pdf-document';
import { haccpFromAi } from '@/features/haccp/schema';
import { saveMenu } from '@/features/menus/api';
import { menuPayloadFromAi } from '@/features/menus/schema';
import { saveRecipe } from '@/features/recipes/api';
import { recipeFromAi, toRecipePayload } from '@/features/recipes/schema';
import { saveSheet } from '@/features/technical-sheets/api';
import type { Term } from '@/features/taxonomy/api';
import { sheetAggregates, sheetFromAi, toSheetPayload } from '@/features/technical-sheets/schema';
import {
  CARD_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  MENU_ITEM_TYPE_LABELS,
  SEASON_LABELS,
  type MenuCategory,
} from '@/shared/domain/constants';
import { formatCurrency, formatDuration, formatNumber, slugify } from '@/shared/lib/format';
import { parseRichText } from '@/shared/lib/rich-text';
import { supabase } from '@/shared/lib/supabase';

export type AnyAiResult = AiResult<AiGenerationType>;

function ingredientTable(ingredients: AiRecipe['ingredients']) {
  return {
    kind: 'table' as const,
    head: ['Ingrédient', 'Quantité', 'Coût'],
    rows: ingredients.map((i) => [i.name, `${formatNumber(i.quantity)} ${i.unit}`, formatCurrency(i.cost)]),
  };
}

function recipeDocument(ai: AiRecipe, imageUrl: string | null): PdfDocument {
  const values = recipeFromAi(ai, imageUrl);
  const { nutrition, costPerPortion, allergens } = computeAggregates({
    ingredients: values.ingredients,
    portions: values.servings,
    portionWeightG: values.portion_weight_g,
    fruitsLegumesPct: values.fruits_legumes_pct,
  });
  return {
    title: ai.title,
    subtitle: ai.description,
    badges: [
      ai.category,
      SEASON_LABELS[ai.season],
      nutrition.nutriScore ? `Nutri-Score ${nutrition.nutriScore}` : '',
    ].filter(Boolean),
    imageUrl,
    sections: [
      {
        heading: 'Informations',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Préparation', value: formatDuration(ai.prep_time) },
              { label: 'Cuisson', value: formatDuration(ai.cook_time) },
              { label: 'Portions', value: String(ai.servings) },
              { label: 'Difficulté', value: DIFFICULTY_LABELS[ai.difficulty] },
              { label: 'Coût / portion', value: formatCurrency(costPerPortion) },
              { label: 'Énergie / portion', value: `${Math.round(nutrition.perPortion.calories)} kcal` },
            ],
          },
        ],
      },
      {
        heading: 'Ingrédients',
        blocks: [
          ingredientTable(ai.ingredients),
          { kind: 'paragraph', text: `Allergènes : ${allergens.join(', ') || 'aucun'}` },
        ],
      },
      { heading: 'Préparation', blocks: [{ kind: 'list', ordered: true, items: ai.steps.map((s) => s.instruction) }] },
      ...optionalSection('Matériel', ai.equipment.join(' · ')),
      ...optionalSection('Dressage', ai.plating),
      ...optionalSection('Conseils du Chef', ai.chef_tips),
      ...optionalSection('Variantes', ai.variations),
      ...optionalSection('Accord mets-vins', ai.wine_pairing),
    ],
  };
}

function optionalSection(heading: string, text: string) {
  return text ? [{ heading, blocks: [{ kind: 'paragraph' as const, text }] }] : [];
}

function sheetDocument(ai: AiTechnicalSheet, imageUrl: string | null): PdfDocument {
  const values = sheetFromAi(ai, imageUrl);
  const { costing, costPerPortion, totalCost, allergens, nutrition } = sheetAggregates(values);
  return {
    title: `Fiche technique — ${ai.title}`,
    subtitle: ai.description,
    badges: [
      ai.category,
      `${ai.portions} portions`,
      nutrition.nutriScore ? `Nutri-Score ${nutrition.nutriScore}` : '',
    ].filter(Boolean),
    imageUrl,
    sections: [
      {
        heading: 'Rentabilité',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Coût matière total', value: formatCurrency(totalCost) },
              { label: 'Coût / portion', value: formatCurrency(costPerPortion) },
              { label: 'Prix de vente TTC', value: formatCurrency(ai.selling_price) },
              { label: 'Coefficient', value: `× ${costing.coefficient}` },
              { label: 'Ratio matière', value: `${costing.foodCostPct} %` },
              { label: 'Marge brute / portion', value: formatCurrency(costing.grossMargin) },
            ],
          },
        ],
      },
      {
        heading: 'Ingrédients',
        blocks: [
          ingredientTable(ai.ingredients),
          { kind: 'paragraph', text: `Allergènes : ${allergens.join(', ') || 'aucun'}` },
        ],
      },
      { heading: 'Progression', blocks: [{ kind: 'list', ordered: true, items: ai.steps.map((s) => s.instruction) }] },
    ],
  };
}

function menuDocument(ai: AiMenu, imageUrl: string | null): PdfDocument {
  return {
    title: ai.title,
    subtitle: ai.description,
    badges: [SEASON_LABELS[ai.season], formatCurrency(ai.price)],
    imageUrl,
    sections: ai.items.map((item) => {
      const values = recipeFromAi(item.recipe);
      const { nutrition } = computeAggregates({
        ingredients: values.ingredients.map((i) => ingredientFromRow(i)),
        portions: values.servings,
        portionWeightG: values.portion_weight_g,
        fruitsLegumesPct: values.fruits_legumes_pct,
      });
      return {
        heading: `${MENU_ITEM_TYPE_LABELS[item.item_type]} — ${item.title}`,
        blocks: [
          { kind: 'paragraph' as const, text: item.description },
          {
            kind: 'keyValue' as const,
            items: [
              { label: 'Recette', value: item.recipe.title },
              { label: 'Énergie / portion', value: `${Math.round(nutrition.perPortion.calories)} kcal` },
              { label: 'Nutri-Score', value: nutrition.nutriScore ?? '—' },
            ],
          },
        ],
      };
    }),
  };
}

function cardDocument(ai: AiCard, imageUrl: string | null): PdfDocument {
  return {
    title: ai.title,
    subtitle: ai.description,
    badges: [CARD_CATEGORY_LABELS[ai.category], SEASON_LABELS[ai.season]],
    imageUrl,
    sections: ai.sections.map((section) => ({
      heading: section.title,
      blocks: [
        {
          kind: 'table' as const,
          head: ['Plat', 'Prix'],
          rows: section.items.map((item) => [
            `${item.title}${item.is_suggestion ? ' ★' : ''}${item.description ? `\n${item.description}` : ''}`,
            formatCurrency(item.price),
          ]),
        },
      ],
    })),
  };
}

function haccpDocument(ai: AiHaccp): PdfDocument {
  return {
    title: ai.title,
    subtitle: ai.zone ? `Zone : ${ai.zone}` : undefined,
    badges: [`${ai.items.length} points de contrôle`, `${ai.items.filter((i) => i.critical).length} critiques`],
    sections: [
      {
        heading: 'Points de contrôle',
        blocks: [
          {
            kind: 'table',
            head: ['Contrôle', 'Fréquence', 'CCP'],
            rows: ai.items.map((item) => [
              `${item.check}${item.corrective_action ? `\nAction corrective : ${item.corrective_action}` : ''}`,
              item.frequency,
              item.critical ? 'Oui' : 'Non',
            ]),
          },
        ],
      },
    ],
  };
}

function suggestionsDocument(ai: AiSuggestions): PdfDocument {
  return {
    title: 'Idées de recettes',
    badges: [`${ai.ideas.length} idées`],
    sections: ai.ideas.map((idea) => ({
      heading: idea.title,
      blocks: [
        { kind: 'paragraph' as const, text: idea.pitch },
        ...(idea.key_ingredients.length
          ? [{ kind: 'paragraph' as const, text: `Produits clés : ${idea.key_ingredients.join(', ')}` }]
          : []),
      ],
    })),
  };
}

function articleDocument(ai: AiArticle, imageUrl: string | null): PdfDocument {
  const sections: PdfDocument['sections'] = [{ heading: 'Introduction', blocks: [] }];
  for (const block of parseRichText(ai.body)) {
    const current = sections.at(-1)!;
    if (block.type === 'h2' || block.type === 'h3') sections.push({ heading: block.text, blocks: [] });
    else if ('items' in block) current.blocks.push({ kind: 'list', ordered: block.type === 'ol', items: block.items });
    else current.blocks.push({ kind: 'paragraph', text: block.text });
  }
  return {
    title: ai.title,
    subtitle: ai.excerpt,
    badges: [`${ai.reading_minutes} min de lecture`, ...(ai.difficulty ? [DIFFICULTY_LABELS[ai.difficulty]] : [])],
    imageUrl,
    sections: sections.filter((section) => section.blocks.length > 0),
  };
}

export function aiResultToDocument(type: AiGenerationType, result: AnyAiResult, imageUrl: string | null): PdfDocument {
  switch (type) {
    case 'recipe':
      return recipeDocument(result as AiRecipe, imageUrl);
    case 'technical_sheet':
      return sheetDocument(result as AiTechnicalSheet, imageUrl);
    case 'menu':
      return menuDocument(result as AiMenu, imageUrl);
    case 'card':
      return cardDocument(result as AiCard, imageUrl);
    case 'haccp':
      return haccpDocument(result as AiHaccp);
    case 'suggestions':
      return suggestionsDocument(result as AiSuggestions);
    case 'article':
      return articleDocument(result as AiArticle, imageUrl);
  }
}

export type SaveOptions = {
  menuStyle?: MenuCategory;
  /** Taxonomy used to classify generated recipes in the blog. */
  terms?: Term[];
  /** Publishes the recipe in the blog right away instead of saving a draft. */
  publish?: boolean;
  articleKind?: ArticleKind;
};

/** Persists an AI result and returns the admin page of the created entity. */
export async function saveAiResult(
  type: AiGenerationType,
  result: AnyAiResult,
  imageUrl: string | null,
  options: SaveOptions = {},
): Promise<string> {
  switch (type) {
    case 'recipe': {
      const values = { ...recipeFromAi(result as AiRecipe, imageUrl, options.terms), is_published: !!options.publish };
      return `/admin/recipes/${await saveRecipe(toRecipePayload(values))}`;
    }
    case 'technical_sheet':
      return `/admin/technical-sheets/${await saveSheet(toSheetPayload(sheetFromAi(result as AiTechnicalSheet, imageUrl)))}`;
    case 'menu':
      return `/admin/menus/${await saveMenu(menuPayloadFromAi(result as AiMenu, options.menuStyle ?? 'gastronomique', imageUrl))}`;
    case 'card':
      return `/admin/cards/${await saveCard(cardPayloadFromAi(result as AiCard, imageUrl))}`;
    case 'haccp': {
      const { data, error } = await supabase
        .from('haccp_records')
        .insert(haccpFromAi(result as AiHaccp))
        .select('id')
        .single();
      if (error) throw error;
      return `/admin/haccp/${data.id}`;
    }
    case 'article': {
      const ai = result as AiArticle;
      const { data, error } = await supabase
        .from('articles')
        .insert({
          kind: options.articleKind ?? 'technique',
          title: ai.title,
          slug: slugify(ai.title),
          excerpt: ai.excerpt,
          body: ai.body,
          difficulty: ai.difficulty,
          reading_minutes: ai.reading_minutes,
          tags: ai.tags,
          image_url: imageUrl,
          is_published: false,
        })
        .select('id')
        .single();
      if (error) throw error;
      return `/admin/articles/${data.id}/edit`;
    }
    case 'suggestions':
      throw new Error('Les idées ne sont pas enregistrées : générez d’abord la recette.');
  }
}

export function aiResultTitle(result: AnyAiResult): string {
  return (result as { title: string }).title;
}
