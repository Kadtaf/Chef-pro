import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, Save } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_VALUES,
  MISSION_TYPE_LABELS,
  MISSION_TYPE_VALUES,
} from '@/shared/domain/constants';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes';
import { formatCurrency } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout';
import { missionsCrud } from './api';
import {
  emptyMission,
  missionDays,
  missionFormSchema,
  missionToForm,
  toMissionRow,
  type MissionFormInput,
  type MissionFormValues,
} from './schema';

/** A new mission can be prefilled from a contact message (?client=&email=&phone=&title=&notes=). */
function prefilledMission(params: URLSearchParams): MissionFormValues {
  return {
    ...emptyMission(),
    title: params.get('title') ?? '',
    client_name: params.get('client') ?? '',
    client_email: params.get('email') ?? '',
    client_phone: params.get('phone') ?? '',
    notes: params.get('notes') ?? '',
  };
}

export function Component() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const mission = missionsCrud.useOne(id);
  if (id && mission.isPending) return <PageLoader />;
  if (id && mission.isError) return <ErrorState error={mission.error} onRetry={() => void mission.refetch()} />;
  return (
    <MissionForm key={id ?? 'new'} initial={mission.data ? missionToForm(mission.data) : prefilledMission(params)} />
  );
}

function MissionForm({ initial }: { initial: MissionFormValues }) {
  const navigate = useNavigate();
  const save = missionsCrud.useSave();
  const isEdit = !!initial.id;
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const form = useForm<MissionFormInput, unknown, MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const { register, control, setValue, formState } = form;
  const { errors, isDirty, isSubmitSuccessful } = formState;
  useUnsavedChangesGuard(isDirty && !isSubmitSuccessful);

  const [start, end, rate] = useWatch({ control, name: ['start_date', 'end_date', 'daily_rate'] });
  const days = missionDays(start ?? '', end ?? '', { weekdaysOnly });
  const estimate = days * (Number(rate) || 0);

  const onSubmit = form.handleSubmit(async (values) => {
    const saved = await save.mutateAsync(toMissionRow(values));
    await navigate(`/admin/missions/${saved.id}`);
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-4xl animate-fade-in space-y-6" noValidate>
      <PageHeader
        title={isEdit ? 'Modifier la mission' : 'Nouvelle mission'}
        backTo={isEdit ? `/admin/missions/${initial.id}` : '/admin/missions'}
        actions={
          <Button type="submit" loading={save.isPending}>
            <Save />
            Enregistrer
          </Button>
        }
      />

      <CardSection title="Mission">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Intitulé" required error={errors.title?.message} className="md:col-span-2">
            {(c) => <Input {...c} placeholder="Ex. Remplacement chef de cuisine" {...register('title')} />}
          </Field>
          <Field label="Type">
            {(c) => (
              <Select {...c} {...register('type')}>
                {MISSION_TYPE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {MISSION_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Statut">
            {(c) => (
              <Select {...c} {...register('status')}>
                {MISSION_STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {MISSION_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Lieu" className="md:col-span-2">
            {(c) => <Input {...c} {...register('location')} />}
          </Field>
        </div>
      </CardSection>

      <CardSection title="Client">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Nom / établissement" required error={errors.client_name?.message}>
            {(c) => <Input {...c} {...register('client_name')} />}
          </Field>
          <Field label="Email" error={errors.client_email?.message}>
            {(c) => <Input {...c} type="email" {...register('client_email')} />}
          </Field>
          <Field label="Téléphone">{(c) => <Input {...c} type="tel" {...register('client_phone')} />}</Field>
        </div>
      </CardSection>

      <CardSection title="Dates & rémunération">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Field label="Début" error={errors.start_date?.message}>
            {(c) => <Input {...c} type="date" {...register('start_date')} />}
          </Field>
          <Field label="Fin" error={errors.end_date?.message}>
            {(c) => <Input {...c} type="date" {...register('end_date')} />}
          </Field>
          <Field label="Taux journalier (€)" error={errors.daily_rate?.message}>
            {(c) => (
              <Input {...c} type="number" step="10" min={0} {...register('daily_rate', { valueAsNumber: true })} />
            )}
          </Field>
          <Field label="Montant total (€)" error={errors.total_revenue?.message}>
            {(c) => (
              <Input {...c} type="number" step="0.01" min={0} {...register('total_revenue', { valueAsNumber: true })} />
            )}
          </Field>
        </div>
        {days > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-primary-50 p-3 text-sm text-primary-900">
            <Calculator className="size-4" aria-hidden />
            {days} jour{days > 1 ? 's' : ''} × {formatCurrency(Number(rate) || 0)} ={' '}
            <strong>{formatCurrency(estimate)}</strong>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                className="accent-primary-600"
                checked={weekdaysOnly}
                onChange={(e) => setWeekdaysOnly(e.target.checked)}
              />
              jours ouvrés uniquement
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setValue('total_revenue', estimate, { shouldDirty: true })}
            >
              Appliquer
            </Button>
          </div>
        )}
      </CardSection>

      <CardSection title="Notes">
        <Textarea rows={5} aria-label="Notes" {...register('notes')} />
      </CardSection>
    </form>
  );
}
