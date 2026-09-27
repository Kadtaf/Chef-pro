import { formatQuantity, scaleQuantity } from './scaling';

describe('scaleQuantity', () => {
  it.each([
    [500, 'g', 1.5, 750],
    [120, 'g', 0.5, 60],
    [3, 'pièce', 0.5, 1.5],
    [1, 'pièce', 0.25, 0.5],
    [2.5, 'cl', 1.5, 3.8],
    [0.4, 'g', 1.5, 0.6],
    [333, 'g', 1, 335],
  ])('%s %s × %s → %s', (quantity, unit, factor, expected) => {
    expect(scaleQuantity(quantity, unit, factor)).toBe(expected);
  });

  it('formats with a French decimal comma', () => {
    expect(formatQuantity(1.5)).toBe('1,5');
  });
});
