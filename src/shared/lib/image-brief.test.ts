import { describe, expect, it } from 'vitest';
import { visibleIngredients } from './image-brief';

describe('visibleIngredients', () => {
  it('keeps the main ingredients by weight and drops invisible seasonings', () => {
    expect(
      visibleIngredients([
        { name: 'Sel', quantity: 5, unit: 'g' },
        { name: 'Potimarron', quantity: 1, unit: 'kg' },
        { name: 'Huile d’olive', quantity: 3, unit: 'cl' },
        { name: 'Noisettes', quantity: 40, unit: 'g' },
        { name: 'Crème liquide', quantity: 20, unit: 'cl' },
        { name: 'Poivre du moulin', quantity: 1, unit: 'g' },
      ]),
    ).toEqual(['Potimarron', 'Crème liquide', 'Noisettes']);
  });

  it('estimates pieces and limits the list', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `Légume ${i}`, quantity: i + 1, unit: 'pièce' }));
    expect(visibleIngredients(many, 3)).toEqual(['Légume 11', 'Légume 10', 'Légume 9']);
  });
});
