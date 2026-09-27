/** Scales an ingredient quantity to a new number of servings, rounded to a kitchen-friendly precision. */
export function scaleQuantity(quantity: number, unit: string, factor: number): number {
  const value = quantity * factor;
  if (value === 0) return 0;
  const u = unit.trim().toLowerCase();
  // Countable items: nearest half.
  if (['pièce', 'piece', 'pièces', 'botte', 'gousse', 'feuille', 'tranche'].includes(u)) {
    return Math.max(0.5, Math.round(value * 2) / 2);
  }
  if (value >= 100) return Math.round(value / 5) * 5;
  if (value >= 10) return Math.round(value);
  if (value >= 1) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

export function formatQuantity(value: number): string {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}
