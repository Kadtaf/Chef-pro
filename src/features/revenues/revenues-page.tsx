import { Calendar, Download, Euro, Plus, Receipt, Trash2, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadBlob, toCsv } from '@/shared/lib/download';
import { formatCurrency, formatShortDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-context';
import { CardSection, EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { PageHeader, StatCard } from '@/shared/ui/layout';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { revenuesCrud, useRevenuesByYear } from './api';
import { RevenueDialog } from './revenue-dialog';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function Component() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: revenues = [], isPending, isError, error, refetch } = useRevenuesByYear(year);
  const remove = revenuesCrud.useRemove();
  const confirm = useConfirm();

  const { monthly, total, thisMonth, average } = useMemo(() => {
    const byMonth = MONTHS.map((month) => ({ month, montant: 0 }));
    for (const revenue of revenues) {
      const index = Number(revenue.date_received.slice(5, 7)) - 1;
      if (byMonth[index]) byMonth[index].montant += Number(revenue.amount);
    }
    const sum = byMonth.reduce((acc, m) => acc + m.montant, 0);
    const monthIndex = new Date().getMonth();
    const elapsedMonths = year === currentYear ? monthIndex + 1 : 12;
    return {
      monthly: byMonth,
      total: sum,
      thisMonth: year === currentYear ? (byMonth[monthIndex]?.montant ?? 0) : 0,
      average: sum / elapsedMonths,
    };
  }, [revenues, year, currentYear]);

  const exportCsv = () =>
    downloadBlob(
      toCsv(
        revenues.map((r) => ({
          Date: r.date_received,
          Montant: String(r.amount).replace('.', ','),
          Source: r.source ?? '',
          Mission: r.missions?.title ?? '',
          Client: r.missions?.client_name ?? '',
          'Moyen de paiement': r.payment_method ?? '',
          Facture: r.invoice_number ?? '',
          Description: r.description ?? '',
        })),
      ),
      `revenus-${year}.csv`,
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Revenus"
        description="Livre des recettes"
        actions={
          <>
            <Select className="w-28" aria-label="Année" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Button variant="subtle" disabled={revenues.length === 0} onClick={exportCsv}>
              <Download />
              CSV
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus />
              Encaissement
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Euro} label={`Total ${year}`} value={formatCurrency(total)} />
        <StatCard icon={Calendar} label="Ce mois-ci" value={formatCurrency(thisMonth)} tone="secondary" />
        <StatCard icon={TrendingUp} label="Moyenne mensuelle" value={formatCurrency(average)} tone="success" />
        <StatCard icon={Receipt} label="Encaissements" value={revenues.length} tone="warning" />
      </div>

      <CardSection title={`Évolution ${year}`}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k€`} width={48} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: '#fef7ee' }} />
              <Bar dataKey="montant" name="Encaissé" fill="#de5a08" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardSection>

      {isPending ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : revenues.length === 0 ? (
        <EmptyState icon={Euro} title={`Aucun encaissement en ${year}`} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Source / mission</Th>
              <Th className="hidden md:table-cell">Facture</Th>
              <Th className="hidden md:table-cell">Moyen</Th>
              <Th className="text-right">Montant</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {revenues.map((revenue) => (
              <Tr key={revenue.id}>
                <Td className="text-neutral-600">{formatShortDate(revenue.date_received)}</Td>
                <Td>
                  {revenue.missions ? (
                    <Link to={`/admin/missions/${revenue.missions.id}`} className="font-medium hover:text-primary-700">
                      {revenue.missions.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{revenue.source ?? '—'}</span>
                  )}
                  {revenue.description && <p className="text-xs text-neutral-500">{revenue.description}</p>}
                </Td>
                <Td className="hidden md:table-cell">{revenue.invoice_number ?? '—'}</Td>
                <Td className="hidden md:table-cell">{revenue.payment_method ?? '—'}</Td>
                <Td className="text-right font-semibold text-success-700 tabular-nums">
                  {formatCurrency(revenue.amount)}
                </Td>
                <Td className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-error-500 hover:bg-error-50"
                    aria-label="Supprimer"
                    onClick={async () => {
                      if (await confirm({ title: 'Supprimer cet encaissement ?' })) remove.mutate(revenue.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <RevenueDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
