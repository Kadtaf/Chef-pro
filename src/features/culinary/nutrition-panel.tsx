import { AlertTriangle } from 'lucide-react';
import type { Nutrients } from '@/shared/lib/nutrition';
import { formatCurrency, formatNumber } from '@/shared/lib/format';
import { Badge, CardSection } from '@/shared/ui/feedback';
import { NutriScoreScale } from '@/shared/ui/nutri-score';
import type { CulinaryAggregates } from './schema';

const ROWS: { key: keyof Nutrients; label: string; unit: string; indent?: boolean }[] = [
  { key: 'calories', label: 'Énergie', unit: 'kcal' },
  { key: 'lipides', label: 'Lipides', unit: 'g' },
  { key: 'acides_gras_satures', label: 'dont acides gras saturés', unit: 'g', indent: true },
  { key: 'glucides', label: 'Glucides', unit: 'g' },
  { key: 'sucres', label: 'dont sucres', unit: 'g', indent: true },
  { key: 'fibres', label: 'Fibres', unit: 'g' },
  { key: 'proteines', label: 'Protéines', unit: 'g' },
  { key: 'sel', label: 'Sel', unit: 'g' },
];

/** Nutrition facts table (per portion and per 100 g) with Nutri-Score. */
export function NutritionTable({ perPortion, per100g }: { perPortion: Nutrients; per100g: Nutrients | null }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-left text-neutral-500">
          <th scope="col" className="py-2 font-medium">
            Valeurs nutritionnelles
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Par portion
          </th>
          {per100g && (
            <th scope="col" className="py-2 text-right font-medium">
              Pour 100 g
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.key} className="border-b border-neutral-100 last:border-0">
            <th scope="row" className={row.indent ? 'py-1.5 pl-4 font-normal text-neutral-500' : 'py-1.5 font-normal'}>
              {row.label}
            </th>
            <td className="py-1.5 text-right tabular-nums">
              {formatNumber(perPortion[row.key])} {row.unit}
            </td>
            {per100g && (
              <td className="py-1.5 text-right text-neutral-500 tabular-nums">
                {formatNumber(per100g[row.key])} {row.unit}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AllergenList({ allergens }: { allergens: string[] }) {
  if (allergens.length === 0) return <p className="text-sm text-neutral-500">Aucun allergène déclaré.</p>;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Allergènes">
      {allergens.map((allergen) => (
        <li key={allergen}>
          <Badge tone="warning">
            <AlertTriangle className="size-3" aria-hidden />
            {allergen}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/** Live summary shown next to recipe / technical sheet forms. */
export function NutritionPanel({
  aggregates,
  portionsLabel,
}: {
  aggregates: CulinaryAggregates;
  portionsLabel: string;
}) {
  const { nutrition, totalCost, costPerPortion, allergens } = aggregates;
  return (
    <div className="space-y-6">
      <CardSection title="Coûts">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-neutral-500">Coût matière total</dt>
            <dd className="text-xl font-bold text-neutral-900">{formatCurrency(totalCost)}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Coût {portionsLabel}</dt>
            <dd className="text-xl font-bold text-primary-600">{formatCurrency(costPerPortion)}</dd>
          </div>
        </dl>
      </CardSection>

      <CardSection
        title="Nutrition"
        description={
          nutrition.portionWeightG
            ? `Portion de ${formatNumber(nutrition.portionWeightG)} g`
            : 'Renseignez le poids d’une portion (ou des unités en g/ml) pour calculer le Nutri-Score.'
        }
      >
        <div className="space-y-4">
          <NutriScoreScale grade={nutrition.nutriScore} />
          <NutritionTable perPortion={nutrition.perPortion} per100g={nutrition.per100g} />
        </div>
      </CardSection>

      <CardSection title="Allergènes">
        <AllergenList allergens={allergens} />
      </CardSection>
    </div>
  );
}
