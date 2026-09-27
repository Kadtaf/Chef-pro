import type { PdfDocument } from '@/features/export/pdf-document';
import { formatCurrency, formatDuration, formatNumber } from '@/shared/lib/format';
import type { SheetWithChildren } from './api';
import { sheetViewModel } from './sheet-view';

export function sheetToPdf(sheet: SheetWithChildren): PdfDocument {
  const { costing, totalCost, costPerPortion, allergens, nutrition } = sheetViewModel(sheet);
  const n = nutrition.perPortion;
  return {
    title: `Fiche technique — ${sheet.title}`,
    subtitle: sheet.description ?? undefined,
    badges: [
      sheet.category,
      `${sheet.portions} portions`,
      sheet.nutri_score ? `Nutri-Score ${sheet.nutri_score}` : '',
    ].filter(Boolean),
    imageUrl: sheet.image_url,
    sections: [
      {
        heading: 'Production & rentabilité',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Préparation', value: formatDuration(sheet.preparation_time) },
              { label: 'Cuisson', value: formatDuration(sheet.cooking_time) },
              { label: 'Coût matière total', value: formatCurrency(totalCost) },
              { label: 'Coût par portion', value: formatCurrency(costPerPortion) },
              { label: 'Prix de vente TTC', value: formatCurrency(sheet.selling_price) },
              { label: 'Prix de vente HT', value: formatCurrency(costing.sellingPriceHt) },
              { label: 'Coefficient', value: `x ${costing.coefficient}` },
              { label: 'Ratio matière', value: `${costing.foodCostPct} %` },
            ],
          },
        ],
      },
      {
        heading: 'Ingrédients',
        blocks: [
          {
            kind: 'table',
            head: ['Ingrédient', 'Quantité', 'Coût', 'Allergènes'],
            rows: sheet.technical_sheet_ingredients.map((i) => [
              i.name,
              `${formatNumber(i.quantity)} ${i.unit}`,
              formatCurrency(i.cost),
              i.allergens.join(', ') || '-',
            ]),
          },
          { kind: 'paragraph', text: `Allergènes : ${allergens.length ? allergens.join(', ') : 'aucun déclaré'}` },
        ],
      },
      {
        heading: 'Progression',
        blocks: [{ kind: 'list', ordered: true, items: sheet.technical_sheet_steps.map((s) => s.instruction) }],
      },
      {
        heading: 'Nutrition (par portion)',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Énergie', value: `${formatNumber(n.calories)} kcal` },
              { label: 'Protéines', value: `${formatNumber(n.proteines)} g` },
              {
                label: 'Lipides (dont AGS)',
                value: `${formatNumber(n.lipides)} g (${formatNumber(n.acides_gras_satures)} g)`,
              },
              { label: 'Glucides (dont sucres)', value: `${formatNumber(n.glucides)} g (${formatNumber(n.sucres)} g)` },
              { label: 'Fibres', value: `${formatNumber(n.fibres)} g` },
              { label: 'Sel', value: `${formatNumber(n.sel)} g` },
            ],
          },
        ],
      },
    ],
    footer: `Chef Pro Bordeaux — Fiche technique « ${sheet.title} »`,
  };
}
