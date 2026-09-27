import { z } from 'zod';
import { computeNutrition, type NutritionSummary } from '@/shared/lib/nutrition';

/** Number input value: empty / NaN -> 0 (React Hook Form `valueAsNumber` yields NaN when empty). */
export const amount = (message = 'Valeur invalide') =>
  z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? 0 : v),
    z.coerce.number({ error: message }).min(0, 'Doit être positif'),
  );

export const optionalAmount = z.preprocess(
  (v) => (v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? null : v),
  z.coerce.number().positive('Doit être positif').nullable(),
);

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(200),
  quantity: amount(),
  unit: z.string().trim().min(1).max(20),
  cost: amount(),
  allergens: z.array(z.string()),
  calories: amount(),
  lipides: amount(),
  acides_gras_satures: amount(),
  glucides: amount(),
  sucres: amount(),
  proteines: amount(),
  fibres: amount(),
  sel: amount(),
});
export type IngredientValues = z.output<typeof ingredientSchema>;

export const stepSchema = z.object({
  instruction: z.string().trim().min(1, 'Instruction requise').max(4000),
});
export type StepValues = z.output<typeof stepSchema>;

export function emptyIngredient(): IngredientValues {
  return {
    name: '',
    quantity: 0,
    unit: 'g',
    cost: 0,
    allergens: [],
    calories: 0,
    lipides: 0,
    acides_gras_satures: 0,
    glucides: 0,
    sucres: 0,
    proteines: 0,
    fibres: 0,
    sel: 0,
  };
}

export type CulinaryAggregates = {
  nutrition: NutritionSummary;
  totalCost: number;
  costPerPortion: number;
  allergens: string[];
};

/** Everything derived from the ingredient list — the single source of truth. */
export function computeAggregates(params: {
  ingredients: IngredientValues[];
  portions: number;
  portionWeightG?: number | null;
  fruitsLegumesPct?: number;
}): CulinaryAggregates {
  const portions = Math.max(1, params.portions || 1);
  const totalCost = params.ingredients.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
  const allergens = [...new Set(params.ingredients.flatMap((i) => i.allergens ?? []))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );
  return {
    nutrition: computeNutrition({ ...params, portions }),
    totalCost: Math.round(totalCost * 100) / 100,
    costPerPortion: Math.round((totalCost / portions) * 100) / 100,
    allergens,
  };
}

/** Maps a stored ingredient row to form values. */
export function ingredientFromRow(row: Partial<IngredientValues> & { name: string }): IngredientValues {
  return { ...emptyIngredient(), ...row, allergens: row.allergens ?? [] };
}
