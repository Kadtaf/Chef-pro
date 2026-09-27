import { ingredientFromRow } from '@/features/culinary/schema';
import type { SheetWithChildren } from './api';
import { sheetAggregates } from './schema';

export function sheetViewModel(sheet: SheetWithChildren) {
  return sheetAggregates({
    ingredients: sheet.technical_sheet_ingredients.map((row) => ingredientFromRow(row)),
    portions: sheet.portions,
    portion_weight_g: sheet.portion_weight_g,
    fruits_legumes_pct: Number(sheet.fruits_legumes_pct),
    selling_price: Number(sheet.selling_price),
  });
}
