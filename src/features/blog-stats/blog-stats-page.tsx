import { AlertTriangle, Eye, FileText, Heart, Lightbulb, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SEASON_LABELS, labelOf } from '@/shared/domain/constants';
import { cn } from '@/shared/lib/cn';
import { formatShortDate } from '@/shared/lib/format';
import { Badge, CardSection, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Select } from '@/shared/ui/form';
import { PageHeader, StatCard } from '@/shared/ui/layout';
import { auditRecipe, improvementSuggestions, useBlogStats, useRecipeAudit, type BlogStats } from './api';

function Ranking({
  title,
  icon: Icon,
  rows,
  format,
}: {
  title: string;
  icon: typeof Eye;
  rows: BlogStats['topViewed'];
  format: (v: number) => string;
}) {
  return (
    <CardSection
      title={
        <span className="flex items-center gap-2">
          <Icon className="size-5 text-primary-700" aria-hidden /> {title}
        </span>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Pas encore de données.</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, index) => (
            <li key={row.id} className="flex items-center gap-3">
              <span className="w-5 font-display text-xl text-secondary-600">{index + 1}</span>
              <Link to={`/admin/recipes/${row.id}`} className="flex-1 truncate text-sm hover:text-primary-700">
                {row.title}
              </Link>
              <span className="text-sm font-semibold tabular-nums">{format(row.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </CardSection>
  );
}

export function Component() {
  const [days, setDays] = useState(30);
  const stats = useBlogStats(days);
  const audit = useRecipeAudit();

  if (stats.isPending || audit.isPending) return <PageLoader />;
  if (stats.isError) return <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />;
  if (audit.isError) return <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />;

  const s = stats.data;
  const suggestions = improvementSuggestions(audit.data, s);
  const audited = audit.data
    .map((recipe) => ({ recipe, ...auditRecipe(recipe) }))
    .filter((entry) => entry.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);
  const daily = s.daily.map((d) => ({ ...d, label: formatShortDate(d.day).slice(0, 5) }));
  const bySeason = s.bySeason.map((d) => ({ ...d, label: labelOf(SEASON_LABELS, d.season) }));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Statistiques du blog"
        description="Audience, engagement des lecteurs et qualité éditoriale"
        actions={
          <Select className="w-44" aria-label="Période" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
            <option value={365}>12 derniers mois</option>
          </Select>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Recettes publiées"
          value={s.totals.published}
          hint={`${s.totals.drafts} brouillon(s)`}
        />
        <StatCard icon={Eye} label="Vues (total)" value={s.totals.views.toLocaleString('fr-FR')} tone="secondary" />
        <StatCard icon={Heart} label="Favoris" value={s.totals.likes.toLocaleString('fr-FR')} tone="warning" />
        <StatCard icon={Star} label="Notes reçues" value={s.totals.ratings.toLocaleString('fr-FR')} tone="success" />
      </div>

      <CardSection title="Audience quotidienne">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8a2c42" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8a2c42" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="views"
                name="Vues"
                stroke="#8a2c42"
                strokeWidth={2}
                fill="url(#viewsGradient)"
              />
              <Area
                type="monotone"
                dataKey="likes"
                name="Favoris"
                stroke="#b8914a"
                strokeWidth={2}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardSection>

      <div className="grid gap-6 lg:grid-cols-3">
        <Ranking title="Les plus vues" icon={Eye} rows={s.topViewed} format={(v) => v.toLocaleString('fr-FR')} />
        <Ranking title="Les plus aimées" icon={Heart} rows={s.topLiked} format={(v) => v.toLocaleString('fr-FR')} />
        <Ranking
          title="Les mieux notées"
          icon={Star}
          rows={s.topRated}
          format={(v) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/5`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CardSection
          title="Tendances par saison"
          description={`Vues et favoris sur ${days} jours, par saison de recette`}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeason}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" name="Vues" fill="#8a2c42" radius={[4, 4, 0, 0]} />
                <Bar dataKey="likes" name="Favoris" fill="#b8914a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardSection>

        <CardSection
          title={
            <span className="flex items-center gap-2">
              <Lightbulb className="size-5 text-secondary-600" aria-hidden /> Suggestions d'amélioration
            </span>
          }
        >
          {suggestions.length === 0 ? (
            <p className="text-sm text-neutral-500">Tout est à jour. Bravo !</p>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.text}
                  className={cn(
                    'flex gap-3 rounded-lg p-3 text-sm',
                    suggestion.tone === 'warning' ? 'bg-warning-50 text-warning-900' : 'bg-cream-100 text-neutral-700',
                  )}
                >
                  {suggestion.tone === 'warning' ? (
                    <AlertTriangle className="size-4 shrink-0 text-warning-600" aria-hidden />
                  ) : (
                    <Lightbulb className="size-4 shrink-0 text-secondary-600" aria-hidden />
                  )}
                  <span className="flex-1">
                    {suggestion.text}{' '}
                    {suggestion.to && (
                      <Link to={suggestion.to} className="font-semibold underline">
                        Agir
                      </Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardSection>
      </div>

      <CardSection
        title="Recettes à compléter"
        description="Score de complétude éditoriale (photo, types, conseils, accord mets-vins…)"
      >
        {audited.length === 0 ? (
          <p className="text-sm text-neutral-500">Toutes les recettes sont complètes.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {audited.map(({ recipe, score, missing }) => (
              <li key={recipe.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="w-14">
                  <Badge tone={score >= 75 ? 'success' : score >= 50 ? 'warning' : 'error'}>{score} %</Badge>
                </div>
                <Link
                  to={`/admin/recipes/${recipe.id}/edit`}
                  className="min-w-40 flex-1 font-medium hover:text-primary-700"
                >
                  {recipe.title}
                </Link>
                <span className="text-xs text-neutral-500">Manque : {missing.join(', ')}</span>
              </li>
            ))}
          </ul>
        )}
      </CardSection>
    </div>
  );
}
