import { z } from 'zod';
import type { AiRecipe } from '@ai-contract';
import type { Term } from '@/features/taxonomy/api';
import { DIFFICULTY_VALUES, SEASON_VALUES } from '@/shared/domain/constants';
import { withDetectedAllergens } from '@/shared/lib/allergens';
import { slugify } from '@/shared/lib/format';
import {
  amount,
  computeAggregates,
  ingredientFromRow,
  ingredientSchema,
  optionalAmount,
  stepSchema,
  type IngredientValues,
  type StepValues,
} from '@/features/culinary/schema';
import type { RecipeWithChildren } from './api';

const longText = z.string().trim().max(4000);

export const recipeFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, 'Titre requis (2 caractères min.)').max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, 'Minuscules, chiffres et tirets uniquement'),
  description: z.string().trim().max(2000),
  category: z.string().min(1, 'Catégorie requise'),
  season: z.enum(SEASON_VALUES),
  difficulty: z.enum(DIFFICULTY_VALUES),
  prep_time: amount(),
  cook_time: amount(),
  servings: z.coerce.number().int('Nombre entier').min(1, '1 portion minimum').max(500),
  portion_weight_g: optionalAmount,
  fruits_legumes_pct: amount().pipe(z.number().max(100, '100 % maximum')),
  image_url: z.union([z.url('URL invalide'), z.literal('')]),
  plating: longText,
  equipment: z.array(z.string().trim().min(1).max(80)).max(30),
  chef_tips: longText,
  variations: longText,
  wine_pairing: z.string().trim().max(1000),
  term_ids: z.array(z.string()),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  ingredients: z.array(ingredientSchema),
  steps: z.array(stepSchema),
});

export type RecipeFormInput = z.input<typeof recipeFormSchema>;
export type RecipeFormValues = z.output<typeof recipeFormSchema>;

export const emptyRecipe = (): RecipeFormValues => ({
  title: '',
  slug: '',
  description: '',
  category: 'Plat principal',
  season: 'all',
  difficulty: 'moyen',
  prep_time: 0,
  cook_time: 0,
  servings: 4,
  portion_weight_g: null,
  fruits_legumes_pct: 0,
  image_url: '',
  plating: '',
  equipment: [],
  chef_tips: '',
  variations: '',
  wine_pairing: '',
  term_ids: [],
  is_published: false,
  is_featured: false,
  ingredients: [],
  steps: [],
});

export function recipeToForm(recipe: RecipeWithChildren): RecipeFormValues {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description ?? '',
    category: recipe.category,
    season: (SEASON_VALUES as readonly string[]).includes(recipe.season ?? '')
      ? (recipe.season as RecipeFormValues['season'])
      : 'all',
    difficulty: (DIFFICULTY_VALUES as readonly string[]).includes(recipe.difficulty ?? '')
      ? (recipe.difficulty as RecipeFormValues['difficulty'])
      : 'moyen',
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    servings: recipe.servings,
    portion_weight_g: recipe.portion_weight_g,
    fruits_legumes_pct: Number(recipe.fruits_legumes_pct),
    image_url: recipe.image_url ?? '',
    plating: recipe.plating ?? '',
    equipment: recipe.equipment,
    chef_tips: recipe.chef_tips ?? '',
    variations: recipe.variations ?? '',
    wine_pairing: recipe.wine_pairing ?? '',
    term_ids: recipe.recipe_terms.map((t) => t.term_id),
    is_published: recipe.is_published,
    is_featured: recipe.is_featured,
    ingredients: recipe.recipe_ingredients.map((row) => ingredientFromRow(row)),
    steps: recipe.recipe_steps.map((row) => ({ instruction: row.instruction })),
  };
}

const normalize = (value: string) => slugify(value);

/**
 * Maps an AI recipe to form values: taxonomy slugs/names are resolved against
 * the existing terms, and allergens are completed by rule-based detection.
 */
export function recipeFromAi(ai: AiRecipe, imageUrl?: string | null, terms: Term[] = []): RecipeFormValues {
  const termIds = terms
    .filter(
      (term) =>
        (term.kind === 'type' && ai.types.includes(term.slug as (typeof ai.types)[number])) ||
        (term.kind === 'cuisine' && ai.cuisine === term.slug) ||
        (term.kind === 'technique' &&
          ai.techniques.some((t) => normalize(t) === term.slug || normalize(t) === normalize(term.name))),
    )
    .map((term) => term.id);

  return {
    ...emptyRecipe(),
    title: ai.title,
    description: ai.description,
    category: ai.category,
    season: ai.season,
    difficulty: ai.difficulty,
    prep_time: ai.prep_time,
    cook_time: ai.cook_time,
    servings: ai.servings,
    portion_weight_g: ai.portion_weight_g,
    fruits_legumes_pct: ai.fruits_legumes_pct,
    image_url: imageUrl ?? '',
    plating: ai.plating,
    equipment: ai.equipment,
    chef_tips: ai.chef_tips,
    variations: ai.variations,
    wine_pairing: ai.wine_pairing,
    term_ids: termIds,
    ingredients: ai.ingredients.map((i) => ingredientFromRow({ ...i, allergens: withDetectedAllergens(i) })),
    steps: ai.steps.map((s) => ({ instruction: s.instruction })),
  };
}

export type RecipePayload = {
  recipe: Record<string, unknown>;
  ingredients: IngredientValues[];
  steps: StepValues[];
  termIds: string[];
};

/** Builds the `save_recipe` RPC payload, computing every derived column. */
export function toRecipePayload(values: RecipeFormValues): RecipePayload {
  const { ingredients, steps, id, slug, term_ids, ...fields } = values;
  const { nutrition, costPerPortion } = computeAggregates({
    ingredients,
    portions: values.servings,
    portionWeightG: values.portion_weight_g,
    fruitsLegumesPct: values.fruits_legumes_pct,
  });

  return {
    recipe: {
      ...(id ? { id } : {}),
      ...fields,
      slug: slug || slugify(values.title),
      image_url: fields.image_url || null,
      description: fields.description || null,
      plating: fields.plating || null,
      chef_tips: fields.chef_tips || null,
      variations: fields.variations || null,
      wine_pairing: fields.wine_pairing || null,
      calories_per_serving: nutrition.perPortion.calories,
      lipides: nutrition.perPortion.lipides,
      acides_gras_satures: nutrition.perPortion.acides_gras_satures,
      glucides: nutrition.perPortion.glucides,
      sucres: nutrition.perPortion.sucres,
      proteines: nutrition.perPortion.proteines,
      fibres: nutrition.perPortion.fibres,
      sel: nutrition.perPortion.sel,
      nutri_score: nutrition.nutriScore,
      cost_per_serving: costPerPortion,
    },
    ingredients,
    steps,
    termIds: term_ids,
  };
}
