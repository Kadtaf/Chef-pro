import { ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, type FieldErrors } from 'react-hook-form';
import { ALLERGENS, UNITS } from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CardSection } from '@/shared/ui/feedback';
import { Input, Select } from '@/shared/ui/form';
import { emptyIngredient, type IngredientValues } from './schema';

type FormWithIngredients = { ingredients: IngredientValues[] };

const NUTRIENT_FIELDS = [
  { name: 'calories', label: 'Énergie (kcal)' },
  { name: 'lipides', label: 'Lipides (g)' },
  { name: 'acides_gras_satures', label: 'dont AG saturés (g)' },
  { name: 'glucides', label: 'Glucides (g)' },
  { name: 'sucres', label: 'dont sucres (g)' },
  { name: 'proteines', label: 'Protéines (g)' },
  { name: 'fibres', label: 'Fibres (g)' },
  { name: 'sel', label: 'Sel (g)' },
] as const;

/** Editable ingredient list. Nutrition values are for the quantity used. */
export function IngredientsEditor() {
  const { control, register, watch, setValue, formState } = useFormContext<FormWithIngredients>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'ingredients' });
  const errors = formState.errors.ingredients as FieldErrors<IngredientValues>[] | undefined;

  return (
    <CardSection
      title="Ingrédients"
      description="Saisissez les quantités totales de la recette ; la nutrition et le coût sont calculés automatiquement."
      actions={
        <Button variant="subtle" size="sm" onClick={() => append(emptyIngredient())}>
          <Plus />
          Ajouter
        </Button>
      }
    >
      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
          Aucun ingrédient. Cliquez sur « Ajouter ».
        </p>
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => {
            const allergens = watch(`ingredients.${index}.allergens`) ?? [];
            const rowErrors = errors?.[index];
            return (
              <li key={field.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                <div className="grid grid-cols-12 items-start gap-2">
                  <div className="col-span-12 flex items-center gap-1 sm:col-span-5">
                    <span className="flex flex-col">
                      <button
                        type="button"
                        className="text-neutral-300 hover:text-neutral-600 disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                        aria-label="Monter"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                    </span>
                    <Input
                      placeholder="Ingrédient"
                      aria-label={`Ingrédient ${index + 1}`}
                      aria-invalid={rowErrors?.name ? true : undefined}
                      {...register(`ingredients.${index}.name`)}
                    />
                  </div>
                  <Input
                    className="col-span-4 sm:col-span-2"
                    type="number"
                    step="any"
                    min={0}
                    placeholder="Qté"
                    aria-label="Quantité"
                    {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                  />
                  <Select
                    className="col-span-4 sm:col-span-2"
                    aria-label="Unité"
                    {...register(`ingredients.${index}.unit`)}
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                  <div className="relative col-span-3 sm:col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Coût"
                      aria-label="Coût (€ HT)"
                      className="pr-7"
                      {...register(`ingredients.${index}.cost`, { valueAsNumber: true })}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-neutral-400">
                      €
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-1 text-error-500 hover:bg-error-50"
                    aria-label={`Supprimer l'ingrédient ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {rowErrors?.name && <p className="mt-1 text-sm text-error-600">{rowErrors.name.message}</p>}

                <details className="group mt-2">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800">
                    <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                    Nutrition & allergènes
                    {allergens.length > 0 && <span className="text-warning-700">· {allergens.join(', ')}</span>}
                  </summary>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {NUTRIENT_FIELDS.map((nutrient) => (
                      <label key={nutrient.name} className="text-xs text-neutral-600">
                        {nutrient.label}
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          className="mt-1 h-9"
                          {...register(`ingredients.${index}.${nutrient.name}`, { valueAsNumber: true })}
                        />
                      </label>
                    ))}
                  </div>
                  <fieldset className="mt-3">
                    <legend className="mb-1 text-xs text-neutral-600">Allergènes</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {ALLERGENS.map((allergen) => {
                        const active = allergens.includes(allergen);
                        return (
                          <button
                            key={allergen}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              setValue(
                                `ingredients.${index}.allergens`,
                                active ? allergens.filter((a) => a !== allergen) : [...allergens, allergen],
                                { shouldDirty: true },
                              )
                            }
                            className={cn(
                              'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                              active
                                ? 'border-warning-300 bg-warning-100 text-warning-800'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300',
                            )}
                          >
                            {allergen}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </CardSection>
  );
}
