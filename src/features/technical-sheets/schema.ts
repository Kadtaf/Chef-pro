import { z } from 'zod';
import type { AiTechnicalSheet } from '@ai-contract';
import { computeCosting } from '@/features/culinary/costing';
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
import { slugify } from '@/shared/lib/format';
import type { SheetWithChildren } from './api';

export const sheetFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, 'Titre requis (2 caractères min.)').max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, 'Minuscules, chiffres et tirets uniquement'),
  category: z.string().min(1),
  description: z.string().trim().max(2000),
  image_url: z.union([z.url('URL invalide'), z.literal('')]),
  portions: z.coerce.number().int('Nombre entier').min(1, '1 portion minimum').max(10_000),
  portion_weight_g: optionalAmount,
  fruits_legumes_pct: amount().pipe(z.number().max(100, '100 % maximum')),
  preparation_time: amount(),
  cooking_time: amount(),
  selling_price: amount(),
  is_published: z.boolean(),
  ingredients: z.array(ingredientSchema),
  steps: z.array(stepSchema),
});

export type SheetFormInput = z.input<typeof sheetFormSchema>;
export type SheetFormValues = z.output<typeof sheetFormSchema>;

export const emptySheet = (): SheetFormValues => ({
  title: '',
  slug: '',
  category: 'Plat principal',
  description: '',
  image_url: '',
  portions: 10,
  portion_weight_g: null,
  fruits_legumes_pct: 0,
  preparation_time: 0,
  cooking_time: 0,
  selling_price: 0,
  is_published: false,
  ingredients: [],
  steps: [],
});

export function sheetToForm(sheet: SheetWithChildren): SheetFormValues {
  return {
    id: sheet.id,
    title: sheet.title,
    slug: sheet.slug,
    category: sheet.category,
    description: sheet.description ?? '',
    image_url: sheet.image_url ?? '',
    portions: sheet.portions,
    portion_weight_g: sheet.portion_weight_g,
    fruits_legumes_pct: Number(sheet.fruits_legumes_pct),
    preparation_time: sheet.preparation_time,
    cooking_time: sheet.cooking_time,
    selling_price: Number(sheet.selling_price),
    is_published: sheet.is_published,
    ingredients: sheet.technical_sheet_ingredients.map((row) => ingredientFromRow(row)),
    steps: sheet.technical_sheet_steps.map((row) => ({ instruction: row.instruction })),
  };
}

export function sheetFromAi(ai: AiTechnicalSheet, imageUrl?: string | null): SheetFormValues {
  return {
    ...emptySheet(),
    title: ai.title,
    description: ai.description,
    category: ai.category,
    portions: ai.portions,
    portion_weight_g: ai.portion_weight_g,
    fruits_legumes_pct: ai.fruits_legumes_pct,
    preparation_time: ai.preparation_time,
    cooking_time: ai.cooking_time,
    selling_price: ai.selling_price,
    image_url: imageUrl ?? '',
    ingredients: ai.ingredients.map((i) => ingredientFromRow(i)),
    steps: ai.steps.map((s) => ({ instruction: s.instruction })),
  };
}

export type SheetPayload = {
  sheet: Record<string, unknown>;
  ingredients: IngredientValues[];
  steps: StepValues[];
};

export function sheetAggregates(
  values: Pick<
    SheetFormValues,
    'ingredients' | 'portions' | 'portion_weight_g' | 'fruits_legumes_pct' | 'selling_price'
  >,
) {
  const aggregates = computeAggregates({
    ingredients: values.ingredients,
    portions: values.portions,
    portionWeightG: values.portion_weight_g,
    fruitsLegumesPct: values.fruits_legumes_pct,
  });
  return { ...aggregates, costing: computeCosting(aggregates.costPerPortion, values.selling_price) };
}

export function toSheetPayload(values: SheetFormValues): SheetPayload {
  const { ingredients, steps, id, slug, ...fields } = values;
  const { nutrition, totalCost, costPerPortion, allergens, costing } = sheetAggregates(values);
  return {
    sheet: {
      ...(id ? { id } : {}),
      ...fields,
      slug: slug || slugify(values.title),
      description: fields.description || null,
      image_url: fields.image_url || null,
      total_cost: totalCost,
      cost_per_portion: costPerPortion,
      margin_ratio: costing.coefficient,
      allergens,
      calories_per_portion: nutrition.perPortion.calories,
      lipides: nutrition.perPortion.lipides,
      acides_gras_satures: nutrition.perPortion.acides_gras_satures,
      glucides: nutrition.perPortion.glucides,
      sucres: nutrition.perPortion.sucres,
      proteines: nutrition.perPortion.proteines,
      fibres: nutrition.perPortion.fibres,
      sel: nutrition.perPortion.sel,
      nutri_score: nutrition.nutriScore,
    },
    ingredients,
    steps,
  };
}
