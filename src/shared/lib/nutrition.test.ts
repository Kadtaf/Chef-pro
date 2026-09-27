import {
  averageGrade,
  computeNutrition,
  emptyNutrients,
  estimatePortionWeight,
  massInGrams,
  nutriScore,
  type Nutrients,
} from './nutrition';

const per100 = (values: Partial<Nutrients>): Nutrients => ({ ...emptyNutrients(), ...values });

describe('massInGrams', () => {
  it.each([
    [2, 'kg', 2000],
    [25, 'cl', 250],
    [100, 'G', 100],
    [3, 'pièce', null],
  ])('%s %s -> %s g', (quantity, unit, expected) => {
    expect(massInGrams(quantity, unit)).toBe(expected);
  });
});

describe('estimatePortionWeight', () => {
  it('divides total mass by portions', () => {
    expect(
      estimatePortionWeight(
        [
          { quantity: 1, unit: 'kg' },
          { quantity: 20, unit: 'cl' },
        ],
        4,
      ),
    ).toBe(300);
  });

  it('returns null when an ingredient cannot be weighed', () => {
    expect(estimatePortionWeight([{ quantity: 2, unit: 'pièce' }], 2)).toBeNull();
  });
});

describe('nutriScore (2023)', () => {
  it('rates plain vegetables A', () => {
    // Broccoli-like: 34 kcal, 1.7 g sugar, 0 sat fat, 0.08 g salt, 2.8 g protein, 2.6 g fibre, 100 % veg.
    const { grade } = nutriScore({
      per100g: per100({ calories: 34, sucres: 1.7, sel: 0.08, proteines: 2.8, fibres: 2.6 }),
      fruitsLegumesPct: 100,
    });
    expect(grade).toBe('A');
  });

  it('rates a butter-rich pastry E', () => {
    // Croissant-like: 406 kcal, 11 g sugar, 11.7 g sat fat, 1.1 g salt, 8 g protein, 2 g fibre.
    const { grade, score } = nutriScore({
      per100g: per100({ calories: 406, sucres: 11, acides_gras_satures: 11.7, sel: 1.1, proteines: 8, fibres: 2 }),
      fruitsLegumesPct: 0,
    });
    // N = energy 5 + sugars 3 + sat fat 10 + salt 5 = 23 >= 11 → proteins ignored.
    expect(score).toBe(23);
    expect(grade).toBe('E');
  });

  it('ignores proteins when negative points reach 11 unless fruit & veg are high', () => {
    const base = per100({ calories: 300, sucres: 20, acides_gras_satures: 5, sel: 0.5, proteines: 20 });
    expect(nutriScore({ per100g: base, fruitsLegumesPct: 0 }).score).toBe(3 + 5 + 4 + 2);
    expect(nutriScore({ per100g: base, fruitsLegumesPct: 90 }).score).toBe(3 + 5 + 4 + 2 - 7 - 5);
  });
});

describe('computeNutrition', () => {
  const ingredients = [
    { quantity: 400, unit: 'g', calories: 400, proteines: 40, lipides: 20, acides_gras_satures: 8, sel: 1 },
    { quantity: 400, unit: 'g', calories: 120, glucides: 20, sucres: 8, fibres: 10 },
  ];

  it('derives per-portion and per-100 g values and a grade', () => {
    const summary = computeNutrition({ ingredients, portions: 4, fruitsLegumesPct: 50 });
    expect(summary.perPortion.calories).toBe(130);
    expect(summary.portionWeightG).toBe(200);
    expect(summary.per100g?.calories).toBe(65);
    expect(summary.nutriScore).toMatch(/[A-E]/);
  });

  it('prefers the manual portion weight', () => {
    expect(computeNutrition({ ingredients, portions: 4, portionWeightG: 260 }).portionWeightG).toBe(260);
  });

  it('returns no grade without data', () => {
    expect(computeNutrition({ ingredients: [], portions: 4 }).nutriScore).toBeNull();
  });
});

describe('averageGrade', () => {
  it('averages letters', () => {
    expect(averageGrade(['A', 'C', null, 'B'])).toBe('B');
    expect(averageGrade([])).toBeNull();
  });
});
