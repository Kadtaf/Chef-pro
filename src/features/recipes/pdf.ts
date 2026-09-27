import type { PdfDocument } from '@/features/export/pdf-document';
import { DIFFICULTY_LABELS, SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency, formatDuration, formatNumber } from '@/shared/lib/format';
import type { RecipeWithChildren } from './api';
import { recipeAggregates } from './aggregates';

export function recipeToPdf(recipe: RecipeWithChildren, { withCosts = true } = {}): PdfDocument {
  const { nutrition, allergens, totalCost, costPerPortion } = recipeAggregates(recipe);
  const n = nutrition.perPortion;

  return {
    title: recipe.title,
    subtitle: recipe.description ?? undefined,
    badges: [
      recipe.category,
      labelOf(SEASON_LABELS, recipe.season),
      recipe.nutri_score ? `Nutri-Score ${recipe.nutri_score}` : '',
    ].filter(Boolean),
    imageUrl: recipe.image_url,
    sections: [
      {
        heading: 'Informations',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Préparation', value: formatDuration(recipe.prep_time) },
              { label: 'Cuisson', value: formatDuration(recipe.cook_time) },
              { label: 'Portions', value: String(recipe.servings) },
              { label: 'Difficulté', value: labelOf(DIFFICULTY_LABELS, recipe.difficulty) },
              ...(withCosts
                ? [
                    { label: 'Coût matière total', value: formatCurrency(totalCost) },
                    { label: 'Coût par portion', value: formatCurrency(costPerPortion) },
                  ]
                : []),
            ],
          },
        ],
      },
      {
        heading: 'Ingrédients',
        blocks: [
          {
            kind: 'table',
            head: withCosts ? ['Ingrédient', 'Quantité', 'Coût'] : ['Ingrédient', 'Quantité'],
            rows: recipe.recipe_ingredients.map((i) => [
              i.name,
              `${formatNumber(i.quantity)} ${i.unit}`,
              ...(withCosts ? [formatCurrency(i.cost)] : []),
            ]),
          },
          { kind: 'paragraph', text: `Allergènes : ${allergens.length ? allergens.join(', ') : 'aucun déclaré'}` },
        ],
      },
      {
        heading: 'Préparation',
        blocks: [{ kind: 'list', ordered: true, items: recipe.recipe_steps.map((s) => s.instruction) }],
      },
      ...(recipe.plating
        ? [{ heading: 'Dressage', blocks: [{ kind: 'paragraph' as const, text: recipe.plating }] }]
        : []),
      {
        heading: 'Valeurs nutritionnelles (par portion)',
        blocks: [
          {
            kind: 'table',
            head: ['Nutriment', 'Par portion'],
            rows: [
              ['Énergie', `${formatNumber(n.calories)} kcal`],
              ['Lipides', `${formatNumber(n.lipides)} g`],
              ['dont acides gras saturés', `${formatNumber(n.acides_gras_satures)} g`],
              ['Glucides', `${formatNumber(n.glucides)} g`],
              ['dont sucres', `${formatNumber(n.sucres)} g`],
              ['Fibres', `${formatNumber(n.fibres)} g`],
              ['Protéines', `${formatNumber(n.proteines)} g`],
              ['Sel', `${formatNumber(n.sel)} g`],
            ],
          },
        ],
      },
    ],
    footer: `Chef Pro Bordeaux — Recette « ${recipe.title} »`,
  };
}
