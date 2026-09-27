/**
 * Nutrition & Nutri-Score (2023 algorithm, "general foods").
 *
 * Ingredient values are stored for the quantity actually used in the recipe.
 * Per-portion values divide the totals by the number of portions; the
 * Nutri-Score is computed per 100 g and therefore needs the portion weight
 * (entered manually or estimated from ingredient masses).
 */

export const NUTRIENT_KEYS = [
  'calories',
  'lipides',
  'acides_gras_satures',
  'glucides',
  'sucres',
  'proteines',
  'fibres',
  'sel',
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type Nutrients = Record<NutrientKey, number>;
export type NutriGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export type NutritionIngredient = Partial<Nutrients> & { quantity: number; unit: string };

const KCAL_TO_KJ = 4.184;

const MASS_FACTORS: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  // Liquids are approximated with a density of 1.
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
};

export function emptyNutrients(): Nutrients {
  return { calories: 0, lipides: 0, acides_gras_satures: 0, glucides: 0, sucres: 0, proteines: 0, fibres: 0, sel: 0 };
}

export function sumNutrients(items: Partial<Nutrients>[]): Nutrients {
  const total = emptyNutrients();
  for (const item of items) {
    for (const key of NUTRIENT_KEYS) total[key] += Number(item[key] ?? 0) || 0;
  }
  return total;
}

export function scaleNutrients(values: Nutrients, factor: number): Nutrients {
  const scaled = emptyNutrients();
  for (const key of NUTRIENT_KEYS) scaled[key] = round(values[key] * factor);
  return scaled;
}

/** Converts a quantity to grams, or null when the unit has no mass (e.g. "pièce"). */
export function massInGrams(quantity: number, unit: string): number | null {
  const factor = MASS_FACTORS[unit.trim().toLowerCase()];
  return factor === undefined ? null : quantity * factor;
}

/** Portion weight from ingredient masses; null if any ingredient cannot be weighed. */
export function estimatePortionWeight(ingredients: NutritionIngredient[], portions: number): number | null {
  if (portions <= 0 || ingredients.length === 0) return null;
  let total = 0;
  for (const ingredient of ingredients) {
    const grams = massInGrams(ingredient.quantity, ingredient.unit);
    if (grams === null) return null;
    total += grams;
  }
  return total > 0 ? round(total / portions) : null;
}

const points = (value: number, thresholds: readonly number[]) => thresholds.filter((t) => value > t).length;

const ENERGY_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SUGARS = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51];
const SATURATED_FAT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SALT = Array.from({ length: 20 }, (_, i) => round((i + 1) * 0.2));
const PROTEINS = [2.4, 4.8, 7.2, 9.6, 12, 14, 17];
const FIBRES = [3.0, 4.1, 5.2, 6.3, 7.4];

function fruitVegetablePoints(pct: number): number {
  if (pct > 80) return 5;
  if (pct > 60) return 2;
  if (pct > 40) return 1;
  return 0;
}

export type NutriScoreInput = {
  /** Values per 100 g. */
  per100g: Nutrients;
  fruitsLegumesPct: number;
};

export function nutriScore({ per100g, fruitsLegumesPct }: NutriScoreInput): { grade: NutriGrade; score: number } {
  const negative =
    points(per100g.calories * KCAL_TO_KJ, ENERGY_KJ) +
    points(per100g.sucres, SUGARS) +
    points(per100g.acides_gras_satures, SATURATED_FAT) +
    points(per100g.sel, SALT);

  const fvl = fruitVegetablePoints(fruitsLegumesPct);
  const proteinPoints = negative < 11 || fvl === 5 ? points(per100g.proteines, PROTEINS) : 0;
  const score = negative - (proteinPoints + points(per100g.fibres, FIBRES) + fvl);

  const grade: NutriGrade = score <= 0 ? 'A' : score <= 2 ? 'B' : score <= 10 ? 'C' : score <= 18 ? 'D' : 'E';
  return { grade, score };
}

export type NutritionSummary = {
  totals: Nutrients;
  perPortion: Nutrients;
  portionWeightG: number | null;
  per100g: Nutrients | null;
  nutriScore: NutriGrade | null;
};

export function computeNutrition(params: {
  ingredients: NutritionIngredient[];
  portions: number;
  portionWeightG?: number | null;
  fruitsLegumesPct?: number;
}): NutritionSummary {
  const portions = Math.max(1, params.portions || 1);
  const totals = sumNutrients(params.ingredients);
  const perPortion = scaleNutrients(totals, 1 / portions);
  const portionWeightG =
    params.portionWeightG && params.portionWeightG > 0
      ? params.portionWeightG
      : estimatePortionWeight(params.ingredients, portions);

  const hasData = params.ingredients.length > 0 && totals.calories > 0;
  const per100g = portionWeightG && hasData ? scaleNutrients(perPortion, 100 / portionWeightG) : null;

  return {
    totals,
    perPortion,
    portionWeightG,
    per100g,
    nutriScore: per100g ? nutriScore({ per100g, fruitsLegumesPct: params.fruitsLegumesPct ?? 0 }).grade : null,
  };
}

const GRADE_ORDER: NutriGrade[] = ['A', 'B', 'C', 'D', 'E'];

/** Average of several grades (rounded), e.g. for a whole menu. */
export function averageGrade(grades: (string | null | undefined)[]): NutriGrade | null {
  const indexes = grades.map((g) => GRADE_ORDER.indexOf(g as NutriGrade)).filter((i) => i >= 0);
  if (indexes.length === 0) return null;
  const avg = Math.round(indexes.reduce((a, b) => a + b, 0) / indexes.length);
  return GRADE_ORDER[avg] ?? null;
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
