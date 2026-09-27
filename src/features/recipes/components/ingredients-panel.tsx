import { ClipboardCopy, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AllergenList } from '@/features/culinary/nutrition-panel';
import { cn } from '@/shared/lib/cn';
import type { Tables } from '@/shared/types/database';
import { formatQuantity, scaleQuantity } from '../scaling';

type Ingredient = Tables<'recipe_ingredients'>;

/** Ingredient list with a servings scaler, tickable items and a copyable shopping list. */
export function IngredientsPanel({
  ingredients,
  baseServings,
  servings,
  onServingsChange,
  allergens,
  equipment,
}: {
  ingredients: Ingredient[];
  baseServings: number;
  servings: number;
  onServingsChange: (servings: number) => void;
  allergens: string[];
  equipment: string[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const factor = servings / Math.max(1, baseServings);

  const lines = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: `${formatQuantity(scaleQuantity(Number(i.quantity), i.unit, factor))} ${i.unit}`,
  }));

  const copyShoppingList = async () => {
    const text = [
      `Liste de courses — ${servings} personne${servings > 1 ? 's' : ''}`,
      ...lines.map((l) => `☐ ${l.quantity} ${l.name}`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Liste de courses copiée');
    } catch {
      toast.error('Copie impossible sur ce navigateur');
    }
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="ingredients-title">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="ingredients-title" className="text-3xl text-neutral-900">
            Ingrédients
          </h2>
          <div className="flex items-center gap-1 rounded-full border border-neutral-300 bg-white p-1 print:hidden">
            <button
              type="button"
              onClick={() => onServingsChange(Math.max(1, servings - 1))}
              className="flex size-8 items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-40"
              disabled={servings <= 1}
              aria-label="Une portion de moins"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-20 text-center text-sm font-medium" aria-live="polite">
              {servings} pers.
            </span>
            <button
              type="button"
              onClick={() => onServingsChange(Math.min(50, servings + 1))}
              className="flex size-8 items-center justify-center rounded-full hover:bg-neutral-100"
              aria-label="Une portion de plus"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {lines.length === 0 ? (
          <p className="text-neutral-500">Ingrédients non spécifiés.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {lines.map((line) => {
              const done = checked.has(line.id);
              return (
                <li key={line.id}>
                  <label className="flex cursor-pointer items-baseline gap-3 py-3">
                    <input
                      type="checkbox"
                      className="translate-y-0.5 accent-primary-700 print:hidden"
                      checked={done}
                      onChange={() =>
                        setChecked((prev) => {
                          const next = new Set(prev);
                          if (next.has(line.id)) next.delete(line.id);
                          else next.add(line.id);
                          return next;
                        })
                      }
                    />
                    <span className={cn('flex-1', done && 'text-neutral-400 line-through')}>{line.name}</span>
                    <span className="shrink-0 font-medium text-neutral-900 tabular-nums">{line.quantity}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => void copyShoppingList()}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline print:hidden"
        >
          <ClipboardCopy className="size-4" aria-hidden />
          Copier la liste de courses
        </button>
      </section>

      <section aria-labelledby="allergens-title" className="rounded-2xl border border-warning-200 bg-warning-50 p-5">
        <h2
          id="allergens-title"
          className="mb-3 font-sans text-sm font-semibold tracking-wide text-warning-800 uppercase"
        >
          Allergènes présents
        </h2>
        <AllergenList allergens={allergens} />
        <p className="mt-3 text-xs text-warning-800/80">
          Liste établie à partir des ingrédients. En cas d&apos;allergie, vérifiez toujours l&apos;étiquetage de vos
          produits.
        </p>
      </section>

      {equipment.length > 0 && (
        <section aria-labelledby="equipment-title">
          <h2 id="equipment-title" className="mb-3 text-2xl text-neutral-900">
            Matériel
          </h2>
          <ul className="flex flex-wrap gap-2">
            {equipment.map((item) => (
              <li
                key={item}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
