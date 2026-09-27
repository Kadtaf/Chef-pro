import { computeCosting, foodCostTone, suggestedPrice } from './costing';

describe('computeCosting', () => {
  it('derives HT price, coefficient, food cost and margin', () => {
    // 22 € TTC → 20 € HT ; cost 5 € → coefficient 4, 25 % food cost, 15 € margin.
    expect(computeCosting(5, 22)).toEqual({ sellingPriceHt: 20, coefficient: 4, foodCostPct: 25, grossMargin: 15 });
  });

  it('handles missing values without dividing by zero', () => {
    expect(computeCosting(0, 0)).toEqual({ sellingPriceHt: 0, coefficient: 0, foodCostPct: 0, grossMargin: 0 });
  });
});

describe('suggestedPrice', () => {
  it('applies the target coefficient and VAT, rounded up to 10 cents', () => {
    expect(suggestedPrice(4, 3.5)).toBe(15.4);
  });
});

describe('foodCostTone', () => {
  it.each([
    [0, 'neutral'],
    [28, 'success'],
    [35, 'warning'],
    [45, 'error'],
  ] as const)('%s %% -> %s', (pct, tone) => expect(foodCostTone(pct)).toBe(tone));
});
