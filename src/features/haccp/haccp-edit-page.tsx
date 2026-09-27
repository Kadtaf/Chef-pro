import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  HACCP_STATUS_LABELS,
  HACCP_STATUS_VALUES,
  HACCP_TYPE_LABELS,
  HACCP_TYPE_VALUES,
  type HaccpType,
} from '@/shared/domain/constants';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { Button } from '@/shared/ui/button';
import { Badge, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout';
import { haccpCrud } from './api';
import {
  TEMPERATURE_PRESETS,
  emptyHaccp,
  haccpFormSchema,
  haccpToForm,
  temperatureCompliance,
  toHaccpRow,
  type HaccpFormInput,
  type HaccpFormValues,
} from './schema';

export function Component() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const record = haccpCrud.useOne(id);
  if (id && record.isPending) return <PageLoader />;
  if (id && record.isError) return <ErrorState error={record.error} onRetry={() => void record.refetch()} />;
  const initialType = (HACCP_TYPE_VALUES as readonly string[]).includes(params.get('type') ?? '')
    ? (params.get('type') as HaccpType)
    : 'checklist';
  return <HaccpForm key={id ?? 'new'} initial={record.data ? haccpToForm(record.data) : emptyHaccp(initialType)} />;
}

function HaccpForm({ initial }: { initial: HaccpFormValues }) {
  const navigate = useNavigate();
  const save = haccpCrud.useSave();
  const isEdit = !!initial.id;
  const form = useForm<HaccpFormInput, unknown, HaccpFormValues>({
    resolver: zodResolver(haccpFormSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const { register, control, setValue, formState } = form;
  const { errors, isDirty, isSubmitSuccessful } = formState;
  const checklist = useFieldArray({ control, name: 'checklist_items' });
  useUnsavedChangesGuard(isDirty && !isSubmitSuccessful);

  const type = useWatch({ control, name: 'type' });
  const [temperature, temperatureMin, temperatureMax] = useWatch({
    control,
    name: ['temperature', 'temperature_min', 'temperature_max'],
  });
  const compliance = temperatureCompliance({
    temperature:
      Number.isFinite(Number(temperature)) && temperature !== null && temperature !== '' ? Number(temperature) : null,
    temperature_min:
      temperatureMin === null || temperatureMin === '' || Number.isNaN(Number(temperatureMin))
        ? null
        : Number(temperatureMin),
    temperature_max:
      temperatureMax === null || temperatureMax === '' || Number.isNaN(Number(temperatureMax))
        ? null
        : Number(temperatureMax),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const saved = await save.mutateAsync(toHaccpRow(values));
    await navigate(`/admin/haccp/${saved.id}`);
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-4xl animate-fade-in space-y-6" noValidate>
      <PageHeader
        title={isEdit ? "Modifier l'enregistrement" : 'Nouvel enregistrement HACCP'}
        backTo={isEdit ? `/admin/haccp/${initial.id}` : '/admin/haccp'}
        actions={
          <Button type="submit" loading={save.isPending}>
            <Save />
            Enregistrer
          </Button>
        }
      />

      <CardSection title="Informations">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Type" required>
            {(c) => (
              <Select {...c} {...register('type')}>
                {HACCP_TYPE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {HACCP_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Statut">
            {(c) => (
              <Select {...c} {...register('status')}>
                {HACCP_STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {HACCP_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Intitulé" required error={errors.title?.message} className="md:col-span-2">
            {(c) => <Input {...c} placeholder="Ex. Relevé chambre froide positive n°1" {...register('title')} />}
          </Field>
          <Field label="Zone / équipement">
            {(c) => <Input {...c} placeholder="Cuisine chaude, légumerie…" {...register('zone')} />}
          </Field>
          <Field label="Responsable">
            {(c) => <Input {...c} autoComplete="name" {...register('responsible_person')} />}
          </Field>
          <Field label="Description" className="md:col-span-2">
            {(c) => <Textarea {...c} rows={2} {...register('description')} />}
          </Field>
        </div>
      </CardSection>

      {type === 'temperature' && (
        <CardSection
          title="Relevé de température"
          description="Choisissez un seuil réglementaire ou saisissez vos limites."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {TEMPERATURE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="subtle"
                size="sm"
                onClick={() => {
                  setValue('temperature_min', preset.min, { shouldDirty: true });
                  setValue('temperature_max', preset.max, { shouldDirty: true });
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Température relevée (°C)" required error={errors.temperature?.message}>
              {(c) => <Input {...c} type="number" step="0.1" {...register('temperature', { valueAsNumber: true })} />}
            </Field>
            <Field label="Seuil minimum (°C)" error={errors.temperature_min?.message}>
              {(c) => (
                <Input {...c} type="number" step="0.1" {...register('temperature_min', { valueAsNumber: true })} />
              )}
            </Field>
            <Field label="Seuil maximum (°C)" error={errors.temperature_max?.message}>
              {(c) => (
                <Input {...c} type="number" step="0.1" {...register('temperature_max', { valueAsNumber: true })} />
              )}
            </Field>
          </div>
          {compliance !== 'unknown' && (
            <p className="mt-4" role="status">
              {compliance === 'ok' ? (
                <Badge tone="success" className="text-sm">
                  <CheckCircle2 className="size-4" aria-hidden /> Relevé conforme
                </Badge>
              ) : (
                <Badge tone="error" className="text-sm">
                  <AlertTriangle className="size-4" aria-hidden /> Hors limites : l&apos;enregistrement sera marqué non
                  conforme
                </Badge>
              )}
            </p>
          )}
        </CardSection>
      )}

      <CardSection
        title="Points de contrôle"
        description="Facultatif pour les relevés ; recommandé pour les checklists, nettoyages et réceptions."
        actions={
          <Button
            variant="subtle"
            size="sm"
            onClick={() =>
              checklist.append({
                item: '',
                category: '',
                frequency: 'quotidien',
                critical: false,
                corrective_action: '',
                completed: false,
              })
            }
          >
            <Plus />
            Ajouter
          </Button>
        }
      >
        {checklist.fields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
            Aucun point de contrôle.
          </p>
        ) : (
          <ol className="space-y-3">
            {checklist.fields.map((field, index) => (
              <li key={field.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                <div className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-12 md:col-span-6"
                    placeholder="Point de contrôle"
                    aria-label={`Point de contrôle ${index + 1}`}
                    aria-invalid={errors.checklist_items?.[index]?.item ? true : undefined}
                    {...register(`checklist_items.${index}.item`)}
                  />
                  <Input
                    className="col-span-6 md:col-span-3"
                    placeholder="Catégorie"
                    aria-label="Catégorie"
                    {...register(`checklist_items.${index}.category`)}
                  />
                  <Input
                    className="col-span-6 md:col-span-3"
                    placeholder="Fréquence"
                    aria-label="Fréquence"
                    {...register(`checklist_items.${index}.frequency`)}
                  />
                  <Input
                    className="col-span-12 md:col-span-8"
                    placeholder="Action corrective en cas d'écart"
                    aria-label="Action corrective"
                    {...register(`checklist_items.${index}.corrective_action`)}
                  />
                  <label className="col-span-8 flex items-center gap-2 text-sm text-neutral-700 md:col-span-3">
                    <input
                      type="checkbox"
                      className="size-4 accent-error-600"
                      {...register(`checklist_items.${index}.critical`)}
                    />
                    Point critique (CCP)
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-4 justify-self-end text-error-500 hover:bg-error-50 md:col-span-1"
                    aria-label="Supprimer le point"
                    onClick={() => checklist.remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {errors.checklist_items?.[index]?.item && (
                  <p className="mt-1 text-sm text-error-600">{errors.checklist_items[index].item.message}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardSection>

      <CardSection title="Observations">
        <Textarea
          rows={4}
          aria-label="Observations"
          placeholder="Écarts constatés, mesures prises…"
          {...register('notes')}
        />
      </CardSection>
    </form>
  );
}
