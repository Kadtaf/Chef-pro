/** Page indexes to display (0-based), with `null` for an ellipsis: 1 … 4 5 6 … 12 */
export function pageItems(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
  const around = [page - 1, page, page + 1].filter((p) => p > 0 && p < pageCount - 1);
  const items: (number | null)[] = [0];
  if (around[0]! > 1) items.push(null);
  items.push(...around);
  if (around.at(-1)! < pageCount - 2) items.push(null);
  items.push(pageCount - 1);
  return items;
}
