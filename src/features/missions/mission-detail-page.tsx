import { Briefcase, Calendar, Mail, MapPin, Phone, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { DetailActions } from '@/features/admin-shell/detail-actions';
import type { PdfDocument } from '@/features/export/pdf-document';
import { revenuesCrud } from '@/features/revenues/api';
import { RevenueDialog } from '@/features/revenues/revenue-dialog';
import { MISSION_STATUS_LABELS, MISSION_STATUS_TONES, MISSION_TYPE_LABELS, labelOf } from '@/shared/domain/constants';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { Badge, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { PageHeader, StatCard } from '@/shared/ui/layout';
import { Table, Td, Th } from '@/shared/ui/table';
import { missionsCrud, useMissionRevenues } from './api';
import { missionDays, type Mission } from './schema';

function missionToPdf(mission: Mission, collected: number): PdfDocument {
  return {
    title: mission.title,
    subtitle: `${labelOf(MISSION_TYPE_LABELS, mission.type)} — ${mission.client_name}`,
    badges: [MISSION_STATUS_LABELS[mission.status]],
    sections: [
      {
        heading: 'Mission',
        blocks: [
          {
            kind: 'keyValue',
            items: [
              { label: 'Client', value: mission.client_name },
              { label: 'Lieu', value: mission.location ?? '-' },
              { label: 'Début', value: mission.start_date ? formatDate(mission.start_date) : '-' },
              { label: 'Fin', value: mission.end_date ? formatDate(mission.end_date) : '-' },
              { label: 'Taux journalier', value: formatCurrency(mission.daily_rate) },
              { label: 'Montant total', value: formatCurrency(mission.total_revenue) },
              { label: 'Encaissé', value: formatCurrency(collected) },
              { label: 'Reste à percevoir', value: formatCurrency(Math.max(0, mission.total_revenue - collected)) },
            ],
          },
        ],
      },
      ...(mission.notes ? [{ heading: 'Notes', blocks: [{ kind: 'paragraph' as const, text: mission.notes }] }] : []),
    ],
  };
}

export function Component() {
  const { id } = useParams();
  const { data: mission, isPending, isError, error, refetch } = missionsCrud.useOne(id);
  const { data: payments = [] } = useMissionRevenues(id);
  const remove = missionsCrud.useRemove();
  const removePayment = revenuesCrud.useRemove();
  const confirm = useConfirm();
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const collected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(mission.total_revenue) - collected);
  const days = missionDays(mission.start_date ?? '', mission.end_date ?? '');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={mission.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {labelOf(MISSION_TYPE_LABELS, mission.type)}
            <Badge tone={MISSION_STATUS_TONES[mission.status]}>{MISSION_STATUS_LABELS[mission.status]}</Badge>
          </span>
        }
        backTo="/admin/missions"
        actions={
          <DetailActions
            editTo={`/admin/missions/${mission.id}/edit`}
            pdf={() => missionToPdf(mission, collected)}
            pdfName={`mission-${mission.title}`}
            onDelete={() => remove.mutateAsync(mission.id)}
            deleteLabel="cette mission"
            afterDeleteTo="/admin/missions"
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Montant total" value={formatCurrency(mission.total_revenue)} />
        <StatCard
          icon={Calendar}
          label="Durée"
          value={days ? `${days} j` : '—'}
          hint={`${formatCurrency(mission.daily_rate)} / jour`}
          tone="secondary"
        />
        <StatCard icon={Plus} label="Encaissé" value={formatCurrency(collected)} tone="success" />
        <StatCard icon={Briefcase} label="Reste à percevoir" value={formatCurrency(remaining)} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CardSection title="Client & lieu">
          <ul className="space-y-3 text-sm">
            <li className="font-semibold text-neutral-900">{mission.client_name}</li>
            {mission.client_email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-neutral-400" aria-hidden />
                <a href={`mailto:${mission.client_email}`} className="text-primary-600 hover:underline">
                  {mission.client_email}
                </a>
              </li>
            )}
            {mission.client_phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-neutral-400" aria-hidden />
                <a href={`tel:${mission.client_phone}`} className="text-primary-600 hover:underline">
                  {mission.client_phone}
                </a>
              </li>
            )}
            {mission.location && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-neutral-400" aria-hidden />
                {mission.location}
              </li>
            )}
            <li className="flex items-center gap-2 text-neutral-600">
              <Calendar className="size-4 text-neutral-400" aria-hidden />
              {mission.start_date ? formatDate(mission.start_date) : '—'} →{' '}
              {mission.end_date ? formatDate(mission.end_date) : '—'}
            </li>
          </ul>
        </CardSection>

        <CardSection
          className="lg:col-span-2"
          title="Encaissements"
          actions={
            <Button size="sm" variant="subtle" onClick={() => setPaymentOpen(true)}>
              <Plus />
              Ajouter
            </Button>
          }
        >
          {payments.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucun encaissement enregistré pour cette mission.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Facture</Th>
                  <Th>Moyen</Th>
                  <Th className="text-right">Montant</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <Td>{formatDate(payment.date_received)}</Td>
                    <Td>{payment.invoice_number ?? '—'}</Td>
                    <Td>{payment.payment_method ?? '—'}</Td>
                    <Td className="text-right font-medium tabular-nums">{formatCurrency(payment.amount)}</Td>
                    <Td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-error-500"
                        aria-label="Supprimer l'encaissement"
                        onClick={async () => {
                          if (await confirm({ title: 'Supprimer cet encaissement ?' }))
                            removePayment.mutate(payment.id);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardSection>
      </div>

      {mission.notes && (
        <CardSection title="Notes">
          <p className="whitespace-pre-line text-neutral-700">{mission.notes}</p>
        </CardSection>
      )}

      <RevenueDialog open={paymentOpen} onOpenChange={setPaymentOpen} missionId={mission.id} />
    </div>
  );
}
