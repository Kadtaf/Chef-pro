import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, type FieldErrors } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { CardSection } from '@/shared/ui/feedback';
import { Textarea } from '@/shared/ui/form';
import type { StepValues } from './schema';

type FormWithSteps = { steps: StepValues[] };

export function StepsEditor({ title = 'Étapes' }: { title?: string }) {
  const { control, register, formState } = useFormContext<FormWithSteps>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'steps' });
  const errors = formState.errors.steps as FieldErrors<StepValues>[] | undefined;

  return (
    <CardSection
      title={title}
      actions={
        <Button variant="subtle" size="sm" onClick={() => append({ instruction: '' })}>
          <Plus />
          Ajouter
        </Button>
      }
    >
      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
          Aucune étape.
        </p>
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => (
            <li key={field.id} className="flex items-start gap-3">
              <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                {index + 1}
              </span>
              <div className="flex-1">
                <Textarea
                  rows={2}
                  aria-label={`Étape ${index + 1}`}
                  aria-invalid={errors?.[index]?.instruction ? true : undefined}
                  placeholder="Instruction…"
                  {...register(`steps.${index}.instruction`)}
                />
                {errors?.[index]?.instruction && (
                  <p className="mt-1 text-sm text-error-600">{errors[index].instruction.message}</p>
                )}
              </div>
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Monter l'étape"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Descendre l'étape"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-error-500 hover:bg-error-50"
                aria-label={`Supprimer l'étape ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ol>
      )}
    </CardSection>
  );
}
