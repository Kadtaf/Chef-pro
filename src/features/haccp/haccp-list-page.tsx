import { ClipboardCheck, Download, Plus, Thermometer } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import {
  HACCP_STATUS_LABELS,
  HACCP_STATUS_TONES,
  HACCP_STATUS_VALUES,
  HACCP_TYPE_LABELS,
  HACCP_TYPE_VALUES,
  labelOf,
} from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { downloadBlob, toCsv } from '@/shared/lib/download';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { PageHeader, SearchInput } from '@/shared/ui/layout';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { haccpCrud } from './api';
import { HACCP_ICONS } from './icons';
import { parseChecklist, temperatureCompliance, type HaccpRecord } from './schema';

function exportRegister(records: HaccpRecord[]) {
  const rows = records.map((r) => ({
    Date: formatDateTime(r.created_at),
    Type: labelOf(HACCP_TYPE_LABELS, r.type),
    Intitulé: r.title,
    Zone: r.zone ?? '',
    Responsable: r.responsible_person ?? '',
    'Température (°C)': r.temperature ?? '',
    'Seuil min': r.temperature_min ?? '',
    'Seuil max': r.temperature_max ?? '',
    Statut: labelOf(HACCP_STATUS_LABELS, r.status),
    'Validé le': r.completed_at ? formatDateTime(r.completed_at) : '',
    Observations: r.notes ?? '',
  }));
  downloadBlob(toCsv(rows), `registre-haccp-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function Component() {
  const { data: records = [], isPending, isError, error, refetch } = haccpCrud.useList();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const term = useDeferredValue(search).toLowerCase();

  const visible = records.filter(
    (r) =>
      (!term || `${r.title} ${r.zone ?? ''} ${r.responsible_person ?? ''}`.toLowerCase().includes(term)) &&
      (!type || r.type === type) &&
      (!status || r.status === status),
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="HACCP & qualité"
        description="Plan de maîtrise sanitaire : relevés, nettoyages, réceptions et traçabilité."
        actions={
          <>
            <Button variant="subtle" disabled={visible.length === 0} onClick={() => exportRegister(visible)}>
              <Download />
              Registre CSV
            </Button>
            <Button asChild>
              <Link to="/admin/haccp/new">
                <Plus />
                Nouvel enregistrement
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {HACCP_TYPE_VALUES.map((value) => {
          const Icon = HACCP_ICONS[value];
          const pending = records.filter((r) => r.type === value && r.status === 'pending').length;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => setType(type === value ? '' : value)}
              className={cn(
                'rounded-xl border bg-white p-4 text-left transition-colors hover:border-primary-300',
                type === value ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-100',
              )}
            >
              <Icon className="mb-2 size-5 text-primary-600" aria-hidden />
              <p className="text-sm font-medium text-neutral-900">{HACCP_TYPE_LABELS[value]}</p>
              <p className="text-xs text-neutral-500">{pending} en attente</p>
            </button>
          );
        })}
      </div>

      <Card className="flex flex-col gap-3 p-4 md:flex-row">
        <SearchInput
          className="flex-1"
          placeholder="Rechercher (intitulé, zone, responsable)…"
          aria-label="Rechercher"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="md:w-48" aria-label="Statut" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous statuts</option>
          {HACCP_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {HACCP_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </Card>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Aucun enregistrement"
          description="Créez un relevé ou générez une checklist avec l'IA Studio."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Enregistrement</Th>
              <Th className="hidden md:table-cell">Zone</Th>
              <Th className="hidden lg:table-cell">Détail</Th>
              <Th>Statut</Th>
              <Th className="hidden sm:table-cell">Date</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((record) => {
              const Icon = HACCP_ICONS[record.type];
              const checklist = parseChecklist(record.checklist_items);
              const compliance = temperatureCompliance(record);
              return (
                <Tr key={record.id}>
                  <Td>
                    <Link to={`/admin/haccp/${record.id}`} className="flex items-center gap-3 hover:text-primary-700">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                        <Icon className="size-5 text-primary-600" aria-hidden />
                      </span>
                      <span>
                        <span className="block font-medium text-neutral-900">{record.title}</span>
                        <span className="text-xs text-neutral-500">{HACCP_TYPE_LABELS[record.type]}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="hidden text-neutral-600 md:table-cell">{record.zone ?? '—'}</Td>
                  <Td className="hidden text-neutral-600 lg:table-cell">
                    {record.type === 'temperature' && record.temperature !== null ? (
                      <Badge tone={compliance === 'ko' ? 'error' : compliance === 'ok' ? 'success' : 'neutral'}>
                        <Thermometer className="size-3" aria-hidden /> {record.temperature} °C
                      </Badge>
                    ) : checklist.length > 0 ? (
                      `${checklist.filter((i) => i.completed).length}/${checklist.length} points`
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td>
                    <Badge tone={HACCP_STATUS_TONES[record.status]}>{HACCP_STATUS_LABELS[record.status]}</Badge>
                  </Td>
                  <Td className="hidden text-neutral-500 sm:table-cell">{formatDateTime(record.created_at)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
