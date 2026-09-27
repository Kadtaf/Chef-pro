import { AlertTriangle, CheckCircle2, Thermometer, XCircle } from 'lucide-react';
import { useParams } from 'react-router';
import { DetailActions } from '@/features/admin-shell/detail-actions';
import { HACCP_STATUS_LABELS, HACCP_STATUS_TONES, HACCP_TYPE_LABELS } from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge, Card, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { DefinitionList, PageHeader } from '@/shared/ui/layout';
import { haccpCrud, useUpdateHaccpProgress } from './api';
import { HACCP_ICONS } from './icons';
import { haccpToPdf } from './pdf';
import { parseChecklist, temperatureCompliance } from './schema';

export function Component() {
  const { id } = useParams();
  const { data: record, isPending, isError, error, refetch } = haccpCrud.useOne(id);
  const progress = useUpdateHaccpProgress();
  const remove = haccpCrud.useRemove();

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const checklist = parseChecklist(record.checklist_items);
  const done = checklist.filter((i) => i.completed).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
  const compliance = temperatureCompliance(record);
  const Icon = HACCP_ICONS[record.type];

  const toggleItem = (index: number) =>
    progress.mutate({
      id: record.id,
      checklist: checklist.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item)),
    });

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
      <PageHeader
        title={record.title}
        description={
          <span className="flex items-center gap-2">
            <Icon className="size-4" aria-hidden />
            {HACCP_TYPE_LABELS[record.type]} · créé le {formatDateTime(record.created_at)}
          </span>
        }
        backTo="/admin/haccp"
        actions={
          <DetailActions
            editTo={`/admin/haccp/${record.id}/edit`}
            pdf={() => haccpToPdf(record)}
            pdfName={`haccp-${record.title}`}
            onDelete={() => remove.mutateAsync(record.id)}
            deleteLabel="cet enregistrement"
            afterDeleteTo="/admin/haccp"
          />
        }
      />

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">Statut</span>
          <Badge tone={HACCP_STATUS_TONES[record.status]} className="text-sm">
            {HACCP_STATUS_LABELS[record.status]}
          </Badge>
          {record.completed_at && (
            <span className="text-sm text-neutral-500">le {formatDateTime(record.completed_at)}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="success"
            size="sm"
            disabled={record.status === 'completed' || compliance === 'ko'}
            loading={progress.isPending && progress.variables?.status === 'completed'}
            onClick={() => progress.mutate({ id: record.id, status: 'completed' })}
          >
            <CheckCircle2 />
            Valider conforme
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={record.status === 'failed'}
            loading={progress.isPending && progress.variables?.status === 'failed'}
            onClick={() => progress.mutate({ id: record.id, status: 'failed' })}
          >
            <XCircle />
            Non conforme
          </Button>
          {record.status !== 'pending' && (
            <Button variant="ghost" size="sm" onClick={() => progress.mutate({ id: record.id, status: 'pending' })}>
              Réouvrir
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {record.type === 'temperature' && (
            <CardSection title="Relevé de température">
              <div className="flex flex-wrap items-center gap-6">
                <div
                  className={cn(
                    'flex size-28 flex-col items-center justify-center rounded-2xl',
                    compliance === 'ko'
                      ? 'bg-error-50 text-error-700'
                      : compliance === 'ok'
                        ? 'bg-success-50 text-success-700'
                        : 'bg-neutral-50',
                  )}
                >
                  <Thermometer className="size-6" aria-hidden />
                  <span className="text-3xl font-bold tabular-nums">{record.temperature ?? '—'}°</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    Plage attendue : <strong>{record.temperature_min ?? '−∞'} °C</strong> à{' '}
                    <strong>{record.temperature_max ?? '+∞'} °C</strong>
                  </p>
                  {compliance === 'ko' && (
                    <p className="flex items-center gap-1 font-medium text-error-700">
                      <AlertTriangle className="size-4" aria-hidden /> Hors limites : appliquer l&apos;action corrective
                      et consigner.
                    </p>
                  )}
                  {compliance === 'ok' && <p className="font-medium text-success-700">Relevé conforme</p>}
                </div>
              </div>
            </CardSection>
          )}

          {checklist.length > 0 && (
            <CardSection
              title="Points de contrôle"
              description={`${done}/${checklist.length} réalisés`}
              actions={<span className="text-2xl font-bold text-primary-600">{pct} %</span>}
            >
              <div
                className="mb-4 h-2 overflow-hidden rounded-full bg-neutral-100"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <ul className="divide-y divide-neutral-100">
                {checklist.map((item, index) => (
                  <li key={`${item.item}-${index}`} className="flex gap-3 py-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-5 shrink-0 accent-success-600"
                      checked={item.completed}
                      onChange={() => toggleItem(index)}
                      aria-label={item.item}
                      disabled={progress.isPending}
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          'font-medium',
                          item.completed ? 'text-neutral-400 line-through' : 'text-neutral-900',
                        )}
                      >
                        {item.item}
                        {item.critical && (
                          <Badge tone="error" className="ml-2 align-middle">
                            CCP
                          </Badge>
                        )}
                      </p>
                      {(item.category || item.frequency) && (
                        <p className="text-xs text-neutral-500">
                          {[item.category, item.frequency].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {item.corrective_action && (
                        <p className="mt-1 text-sm text-neutral-600">
                          <span className="font-medium">Action corrective :</span> {item.corrective_action}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardSection>
          )}

          {record.notes && (
            <CardSection title="Observations">
              <p className="whitespace-pre-line text-neutral-700">{record.notes}</p>
            </CardSection>
          )}
        </div>

        <CardSection title="Informations">
          <DefinitionList
            items={[
              { label: 'Zone', value: record.zone ?? '—' },
              { label: 'Responsable', value: record.responsible_person ?? '—' },
              { label: 'Description', value: record.description ?? '—' },
              { label: 'Dernière mise à jour', value: formatDateTime(record.updated_at) },
            ]}
          />
        </CardSection>
      </div>
    </div>
  );
}
