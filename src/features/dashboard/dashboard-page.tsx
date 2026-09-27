import {
  AlertTriangle,
  Briefcase,
  ChefHat,
  ClipboardCheck,
  CreditCard,
  Euro,
  FileText,
  Mail,
  MessageSquare,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { Link } from 'react-router';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/features/auth/use-auth';
import { formatCurrency, formatDateTime, formatMonth } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { PageHeader, StatCard } from '@/shared/ui/layout';
import { useDashboardStats, useRecentActivity } from './api';

const ENTITY_LABELS: Record<string, { label: string; path?: string }> = {
  recipes: { label: 'Recette', path: '/admin/recipes' },
  technical_sheets: { label: 'Fiche technique', path: '/admin/technical-sheets' },
  menus: { label: 'Menu', path: '/admin/menus' },
  cards: { label: 'Carte', path: '/admin/cards' },
  haccp_records: { label: 'HACCP', path: '/admin/haccp' },
  missions: { label: 'Mission', path: '/admin/missions' },
  revenues: { label: 'Encaissement', path: '/admin/revenues' },
  comments: { label: 'Avis', path: '/admin/comments' },
  articles: { label: 'Article', path: '/admin/articles' },
  career_experiences: { label: 'Parcours', path: '/admin/career' },
  services: { label: 'Service', path: '/admin/services' },
  contact_submissions: { label: 'Message', path: '/admin/messages' },
};
const ACTION_LABELS: Record<string, string> = { insert: 'créé', update: 'modifié', delete: 'supprimé' };
const DETAIL_ROUTES = new Set(['recipes', 'technical_sheets', 'menus', 'cards', 'haccp_records', 'missions']);

function greeting() {
  const hour = new Date().getHours();
  return hour < 5 || hour >= 18 ? 'Bonsoir' : 'Bonjour';
}

export function Component() {
  const { profile } = useAuth();
  const stats = useDashboardStats();
  const activity = useRecentActivity();

  if (stats.isPending) return <PageLoader />;
  if (stats.isError) return <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />;

  const s = stats.data;
  const chartData = s.monthly.map((m) => ({ ...m, label: formatMonth(m.month) }));
  const alerts = [
    s.contactSubmissions.unread > 0 && {
      to: '/admin/messages',
      icon: Mail,
      text: `${s.contactSubmissions.unread} message(s) non lu(s)`,
    },
    s.comments.pending > 0 && {
      to: '/admin/comments',
      icon: MessageSquare,
      text: `${s.comments.pending} avis à modérer`,
    },
    s.haccp.failed > 0 && {
      to: '/admin/haccp',
      icon: AlertTriangle,
      text: `${s.haccp.failed} non-conformité(s) HACCP`,
    },
    s.haccp.pending > 0 && {
      to: '/admin/haccp',
      icon: ClipboardCheck,
      text: `${s.haccp.pending} contrôle(s) HACCP en attente`,
    },
  ].filter(Boolean) as { to: string; icon: typeof Mail; text: string }[];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`${greeting()}${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋`}
        description="Vue d'ensemble de votre activité"
        actions={
          <Button asChild variant="subtle">
            <Link to="/admin/ai-studio">
              <Sparkles />
              IA Studio
            </Link>
          </Button>
        }
      />

      {alerts.length > 0 && (
        <Card className="flex flex-wrap gap-2 border-warning-200 bg-warning-50 p-4">
          {alerts.map(({ to, icon: Icon, text }) => (
            <Link
              key={text}
              to={to}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-warning-800 shadow-sm hover:bg-warning-100"
            >
              <Icon className="size-4" aria-hidden />
              {text}
            </Link>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Euro}
          label="Revenus du mois"
          value={formatCurrency(s.revenues.thisMonth)}
          hint={`Total : ${formatCurrency(s.revenues.total)}`}
          tone="success"
        />
        <StatCard
          icon={Briefcase}
          label="Missions en cours"
          value={s.missions.inProgress}
          hint={`${s.missions.pending} en attente · ${s.missions.total} au total`}
        />
        <StatCard
          icon={Mail}
          label="Messages non lus"
          value={s.contactSubmissions.unread}
          hint={`${s.contactSubmissions.total} reçus`}
          tone="warning"
        />
        <StatCard
          icon={MessageSquare}
          label="Avis à modérer"
          value={s.comments.pending}
          hint={`${s.comments.total} avis`}
          tone="secondary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { to: '/admin/recipes', icon: ChefHat, label: 'Recettes', value: s.recipes },
          { to: '/admin/technical-sheets', icon: FileText, label: 'Fiches techniques', value: s.technicalSheets },
          { to: '/admin/menus', icon: UtensilsCrossed, label: 'Menus', value: s.menus },
          { to: '/admin/cards', icon: CreditCard, label: 'Cartes', value: s.cards },
        ].map(({ to, icon: Icon, label, value }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-4 hover:border-primary-200 hover:shadow-sm"
          >
            <Icon className="size-5 text-primary-600" aria-hidden />
            <span className="flex-1 text-sm text-neutral-600">{label}</span>
            <span className="text-lg font-bold text-neutral-900">{value}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardSection title="Revenus sur 12 mois">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#de5a08" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#de5a08" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={48} tickFormatter={(v: number) => `${Math.round(v / 1000)}k€`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="revenues"
                  name="Revenus"
                  stroke="#de5a08"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardSection>
        <CardSection title="Missions démarrées par mois">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                <Tooltip />
                <Bar dataKey="missions" name="Missions" fill="#35906a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardSection>
      </div>

      <CardSection title="Activité récente" description="Journal automatique des modifications">
        {activity.isPending ? (
          <PageLoader />
        ) : !activity.data?.length ? (
          <p className="text-sm text-neutral-500">Aucune activité enregistrée.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {activity.data.map((log) => {
              const entity = ENTITY_LABELS[log.entity_type ?? ''];
              const details = (log.details ?? {}) as { title?: string };
              const link =
                entity?.path && log.action !== 'delete'
                  ? DETAIL_ROUTES.has(log.entity_type ?? '') && log.entity_id
                    ? `${entity.path}/${log.entity_id}`
                    : entity.path
                  : undefined;
              const text = (
                <>
                  <span className="font-medium text-neutral-900">{entity?.label ?? log.entity_type}</span>{' '}
                  {details.title && <span className="text-neutral-700">« {details.title} »</span>}{' '}
                  <span className="text-neutral-500">{ACTION_LABELS[log.action] ?? log.action}</span>
                </>
              );
              return (
                <li key={log.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  {link ? (
                    <Link to={link} className="hover:underline">
                      {text}
                    </Link>
                  ) : (
                    <span>{text}</span>
                  )}
                  <time className="shrink-0 text-xs text-neutral-400" dateTime={log.created_at}>
                    {formatDateTime(log.created_at)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </CardSection>
    </div>
  );
}
