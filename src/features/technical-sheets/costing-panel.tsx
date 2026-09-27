import { Lightbulb } from 'lucide-react';
import { foodCostTone, suggestedPrice, type Costing } from '@/features/culinary/costing';
import { formatCurrency } from '@/shared/lib/format';
import { Badge, CardSection } from '@/shared/ui/feedback';

export function CostingPanel({
  costing,
  costPerPortion,
  onApplySuggestion,
}: {
  costing: Costing;
  costPerPortion: number;
  onApplySuggestion?: (price: number) => void;
}) {
  const suggestion = suggestedPrice(costPerPortion);
  return (
    <CardSection title="Rentabilité" description="Prix TTC, TVA restauration 10 %">
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-neutral-500">Prix de vente HT</dt>
          <dd className="text-xl font-bold text-neutral-900">{formatCurrency(costing.sellingPriceHt)}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">Coefficient</dt>
          <dd className="text-xl font-bold text-neutral-900">× {costing.coefficient.toLocaleString('fr-FR')}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">Ratio matière</dt>
          <dd>
            <Badge tone={foodCostTone(costing.foodCostPct)} className="text-sm">
              {costing.foodCostPct.toLocaleString('fr-FR')} %
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">Marge brute / portion</dt>
          <dd className="text-xl font-bold text-success-700">{formatCurrency(costing.grossMargin)}</dd>
        </div>
      </dl>
      {costPerPortion > 0 && onApplySuggestion && (
        <button
          type="button"
          onClick={() => onApplySuggestion(suggestion)}
          className="mt-4 flex w-full items-center gap-2 rounded-lg bg-primary-50 p-3 text-left text-sm text-primary-800 hover:bg-primary-100"
        >
          <Lightbulb className="size-4 shrink-0" aria-hidden />
          Prix conseillé (coefficient 3,5) : <strong>{formatCurrency(suggestion)}</strong> — appliquer
        </button>
      )}
    </CardSection>
  );
}
