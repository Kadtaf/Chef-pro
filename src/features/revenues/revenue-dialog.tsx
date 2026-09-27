import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMissionOptions } from '@/features/missions/api';
import { PAYMENT_METHODS } from '@/shared/domain/constants';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, Input, Select } from '@/shared/ui/form';
import {
  emptyRevenue,
  revenueFormSchema,
  revenuesCrud,
  toRevenueRow,
  type RevenueFormInput,
  type RevenueFormValues,
} from './api';

/** Records a payment, optionally linked to a mission. */
export function RevenueDialog({
  open,
  onOpenChange,
  missionId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId?: string | null;
}) {
  const save = revenuesCrud.useSave();
  const { data: missions = [] } = useMissionOptions();
  const form = useForm<RevenueFormInput, unknown, RevenueFormValues>({
    resolver: zodResolver(revenueFormSchema),
    defaultValues: emptyRevenue(missionId),
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    await save.mutateAsync(toRevenueRow(values));
    form.reset(emptyRevenue(missionId));
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvel encaissement"
      footer={
        <>
          <Button variant="subtle" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="revenue-form" loading={save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        id="revenue-form"
        onSubmit={(e) => void onSubmit(e)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        noValidate
      >
        <Field label="Montant (€)" required error={errors.amount?.message}>
          {(c) => (
            <Input {...c} type="number" step="0.01" min={0} {...form.register('amount', { valueAsNumber: true })} />
          )}
        </Field>
        <Field label="Date d'encaissement" required error={errors.date_received?.message}>
          {(c) => <Input {...c} type="date" {...form.register('date_received')} />}
        </Field>
        <Field label="Mission" className="sm:col-span-2">
          {(c) => (
            <Select {...c} {...form.register('mission_id', { setValueAs: (v: string) => v || null })}>
              <option value="">Aucune mission</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title} — {mission.client_name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Source / client">{(c) => <Input {...c} {...form.register('source')} />}</Field>
        <Field label="Moyen de paiement">
          {(c) => (
            <Select {...c} {...form.register('payment_method')}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="N° de facture">{(c) => <Input {...c} {...form.register('invoice_number')} />}</Field>
        <Field label="Description">{(c) => <Input {...c} {...form.register('description')} />}</Field>
      </form>
    </Dialog>
  );
}
