/** Restaurant pricing helpers (France: 10 % VAT on food served on site). */
export const DEFAULT_VAT_RATE = 0.1;

export type Costing = {
  sellingPriceHt: number;
  /** Selling price excl. VAT ÷ cost per portion ("coefficient multiplicateur"). */
  coefficient: number;
  /** Cost per portion ÷ selling price excl. VAT, in % ("ratio matière"). */
  foodCostPct: number;
  /** Gross margin per portion excl. VAT. */
  grossMargin: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeCosting(costPerPortion: number, sellingPriceTtc: number, vatRate = DEFAULT_VAT_RATE): Costing {
  const sellingPriceHt = sellingPriceTtc / (1 + vatRate);
  return {
    sellingPriceHt: round2(sellingPriceHt),
    coefficient: costPerPortion > 0 ? round2(sellingPriceHt / costPerPortion) : 0,
    foodCostPct: sellingPriceHt > 0 ? round2((costPerPortion / sellingPriceHt) * 100) : 0,
    grossMargin: round2(sellingPriceHt - costPerPortion),
  };
}

/** Selling price incl. VAT needed to reach a target coefficient. */
export function suggestedPrice(costPerPortion: number, targetCoefficient = 3.5, vatRate = DEFAULT_VAT_RATE): number {
  const tenths = costPerPortion * targetCoefficient * (1 + vatRate) * 10;
  // toFixed strips float noise (15.400000000000002 must not round up to 15.5).
  return Math.ceil(Number(tenths.toFixed(6))) / 10;
}

/** Colour hint for the food-cost ratio (industry target: 25–35 %). */
export function foodCostTone(pct: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (pct <= 0) return 'neutral';
  if (pct <= 30) return 'success';
  if (pct <= 38) return 'warning';
  return 'error';
}
