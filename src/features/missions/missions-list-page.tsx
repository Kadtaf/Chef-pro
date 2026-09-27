import { Briefcase, Plus } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONES,
  MISSION_STATUS_VALUES,
  MISSION_TYPE_LABELS,
  labelOf,
} from '@/shared/domain/constants';
import { formatCurrency, formatShortDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge, Card, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { PageHeader, SearchInput, StatCard } from '@/shared/ui/layout';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { missionsCrud } from './api';

export function Component() {
  const { data: missions = [], isPending, isError, error, refetch } = missionsCrud.useList();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const term = useDeferredValue(search).toLowerCase();

  const visible = missions.filter(
    (m) =>
      (!term || `${m.title} ${m.client_name} ${m.location ?? ''}`.toLowerCase().includes(term)) &&
      (!status || m.status === status),
  );
  const active = missions.filter((m) => m.status === 'en_cours');
  const pipeline = missions
    .filter((m) => m.status === 'en_attente' || m.status === 'en_cours')
    .reduce((sum, m) => sum + Number(m.total_revenue), 0);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Missions"
        description={`${missions.length} mission${missions.length > 1 ? 's' : ''}`}
        actions={
          <Button asChild>
            <Link to="/admin/missions/new">
              <Plus />
              Nouvelle mission
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Briefcase} label="En cours" value={active.length} />
        <StatCard
          icon={Briefcase}
          label="En attente"
          value={missions.filter((m) => m.status === 'en_attente').length}
          tone="warning"
        />
        <StatCard
          icon={Briefcase}
          label="CA prévisionnel (en attente + en cours)"
          value={formatCurrency(pipeline)}
          tone="success"
        />
      </div>

      <Card className="flex flex-col gap-3 p-4 md:flex-row">
        <SearchInput
          className="flex-1"
          placeholder="Rechercher (mission, client, lieu)…"
          aria-label="Rechercher une mission"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="md:w-48" aria-label="Statut" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous statuts</option>
          {MISSION_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {MISSION_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </Card>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Briefcase} title="Aucune mission" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Mission</Th>
              <Th className="hidden md:table-cell">Client</Th>
              <Th className="hidden lg:table-cell">Dates</Th>
              <Th className="text-right">Montant</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((mission) => (
              <Tr key={mission.id}>
                <Td>
                  <Link
                    to={`/admin/missions/${mission.id}`}
                    className="font-medium text-neutral-900 hover:text-primary-700"
                  >
                    {mission.title}
                  </Link>
                  <p className="text-xs text-neutral-500">{labelOf(MISSION_TYPE_LABELS, mission.type)}</p>
                </Td>
                <Td className="hidden md:table-cell">{mission.client_name}</Td>
                <Td className="hidden text-neutral-600 lg:table-cell">
                  {mission.start_date ? formatShortDate(mission.start_date) : '—'}
                  {mission.end_date && ` → ${formatShortDate(mission.end_date)}`}
                </Td>
                <Td className="text-right font-medium tabular-nums">{formatCurrency(mission.total_revenue)}</Td>
                <Td>
                  <Badge tone={MISSION_STATUS_TONES[mission.status]}>{MISSION_STATUS_LABELS[mission.status]}</Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
