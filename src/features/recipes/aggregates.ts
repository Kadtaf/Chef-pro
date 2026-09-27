import { computeAggregates, ingredientFromRow } from '@/features/culinary/schema';
import type { RecipeWithChildren } from './api';

/** Nutrition, cost and allergens of a stored recipe, recomputed from its ingredients. */
export function recipeAggregates(recipe: RecipeWithChildren) {
  return computeAggregates({
    ingredients: recipe.recipe_ingredients.map((row) => ingredientFromRow(row)),
    portions: recipe.servings,
    portionWeightG: recipe.portion_weight_g,
    fruitsLegumesPct: Number(recipe.fruits_legumes_pct),
  });
}
