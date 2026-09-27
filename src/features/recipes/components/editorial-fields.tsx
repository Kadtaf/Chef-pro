import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { CardSection } from '@/shared/ui/feedback';
import { Field, Input, Textarea } from '@/shared/ui/form';

type EditorialForm = {
  equipment: string[];
  chef_tips: string;
  variations: string;
  wine_pairing: string;
  plating: string;
};

/** Blog content around the recipe: equipment, plating, chef tips, variations, wine pairing. */
export function EditorialFields() {
  const { control, register, setValue, formState } = useFormContext<EditorialForm>();
  const equipment = useWatch({ control, name: 'equipment' }) ?? [];
  const [draft, setDraft] = useState('');
  const errors = formState.errors;

  const addEquipment = () => {
    const value = draft.trim();
    if (!value || equipment.includes(value)) return;
    setValue('equipment', [...equipment, value], { shouldDirty: true });
    setDraft('');
  };

  return (
    <CardSection title="Contenu éditorial" description="Affiché sur la fiche publique de la recette.">
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-neutral-700">Matériel nécessaire</legend>
          <div className="mb-2 flex flex-wrap gap-2">
            {equipment.map((item) => (
              <span key={item} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm">
                {item}
                <button
                  type="button"
                  aria-label={`Retirer ${item}`}
                  onClick={() =>
                    setValue(
                      'equipment',
                      equipment.filter((e) => e !== item),
                      { shouldDirty: true },
                    )
                  }
                  className="text-neutral-400 hover:text-error-600"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              aria-label="Ajouter du matériel"
              placeholder="Ex. Poêle en inox, chinois, thermomètre…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEquipment();
                }
              }}
            />
            <Button variant="subtle" onClick={addEquipment}>
              <Plus />
              Ajouter
            </Button>
          </div>
        </fieldset>
        <Field label="Dressage" error={errors.plating?.message}>
          {(c) => <Textarea {...c} rows={3} {...register('plating')} />}
        </Field>
        <Field
          label="Conseils du Chef"
          error={errors.chef_tips?.message}
          hint="Les petits secrets qui font la différence."
        >
          {(c) => <Textarea {...c} rows={4} {...register('chef_tips')} />}
        </Field>
        <Field label="Variantes" error={errors.variations?.message}>
          {(c) => <Textarea {...c} rows={3} {...register('variations')} />}
        </Field>
        <Field
          label="Accord mets-vins"
          error={errors.wine_pairing?.message}
          hint="Appellation, couleur et pourquoi l'accord fonctionne. La mention légale est ajoutée automatiquement."
        >
          {(c) => <Textarea {...c} rows={2} {...register('wine_pairing')} />}
        </Field>
      </div>
    </CardSection>
  );
}
