/**
 * Picks the ingredients worth showing on a food photo: the main ones by weight,
 * without seasonings and cooking fats that are invisible on the plate.
 */
const INVISIBLE =
  /^(sel|fleur de sel|poivre|eau|huile|vinaigre|levure|bicarbonate|g[ée]latine|agar|fond|bouillon|fumet|vin|alcool|cognac|armagnac)\b/i;

const GRAMS_PER_UNIT: Record<string, number> = { g: 1, kg: 1000, ml: 1, cl: 10, l: 1000 };
/** A "pièce" (egg, shallot, fish fillet…) weighs roughly this much. */
const PIECE_GRAMS = 80;

// `quantity` is `unknown` in form values (coerced input), hence the Number() below.
export function visibleIngredients(
  ingredients: { name: string; quantity: unknown; unit: string }[],
  max = 8,
): string[] {
  return ingredients
    .map((i) => ({
      name: i.name.trim(),
      grams: (Number(i.quantity) || 0) * (GRAMS_PER_UNIT[i.unit] ?? PIECE_GRAMS),
    }))
    .filter((i) => i.name && !INVISIBLE.test(i.name))
    .sort((a, b) => b.grams - a.grams)
    .slice(0, max)
    .map((i) => i.name.slice(0, 80));
}
