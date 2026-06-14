import { useEffect, useState } from 'react';
import { supabase, Tables } from '../../lib/supabase';
import {
  ChefHat,
  FileText,
  Menu,
  CreditCard,
  Briefcase,
  Euro,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface Stats {
  recipes: number;
  technicalSheets: number;
  menus: number;
  cards: number;
  missions: { total: number; inProgress: number };
  revenues: { total: number; thisMonth: number };
  comments: { total: number; pending: number };
  contactSubmissions: { total: number; unread: number };
}

interface MonthlyData {
  month: string;
  revenus: number;
  missions: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    recipes: 0,
    technicalSheets: 0,
    menus: 0,
    cards: 0,
    missions: { total: 0, inProgress: 0 },
    revenues: { total: 0, thisMonth: 0 },
    comments: { total: 0, pending: 0 },
    contactSubmissions: { total: 0, unread: 0 },
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentActivity, setRecentActivity] = useState<Tables<'activity_logs'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // Fetch counts in parallel
      const [
        recipesRes,
        technicalSheetsRes,
        menusRes,
        cardsRes,
        missionsRes,
        revenuesRes,
        commentsRes,
        contactRes,
        activityRes,
      ] = await Promise.all([
        supabase.from('recipes').select('id', { count: 'exact', head: true }),
        supabase.from('technical_sheets').select('id', { count: 'exact', head: true }),
        supabase.from('menus').select('id', { count: 'exact', head: true }),
        supabase.from('cards').select('id', { count: 'exact', head: true }),
        supabase.from('missions').select('*'),
        supabase.from('revenues').select('*'),
        supabase.from('comments').select('*'),
        supabase.from('contact_submissions').select('*'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      // Calculate stats
      const revenues = revenuesRes.data || [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthRevenues = revenues
        .filter((r) => {
          const d = new Date(r.date_received);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, r) => acc + r.amount, 0);

      const missions = missionsRes.data || [];
      const inProgress = missions.filter((m) => m.status === 'en_cours').length;

      const comments = commentsRes.data || [];
      const pendingComments = comments.filter((c) => !c.is_approved).length;

      const contactSubmissions = contactRes.data || [];
      const unreadContact = contactSubmissions.filter((c) => !c.is_read).length;

      setStats({
        recipes: recipesRes.count || 0,
        technicalSheets: technicalSheetsRes.count || 0,
        menus: menusRes.count || 0,
        cards: cardsRes.count || 0,
        missions: { total: missions.length, inProgress },
        revenues: {
          total: revenues.reduce((acc, r) => acc + r.amount, 0),
          thisMonth: thisMonthRevenues,
        },
        comments: { total: comments.length, pending: pendingComments },
        contactSubmissions: { total: contactSubmissions.length, unread: unreadContact },
      });

      // Generate monthly data for chart
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthlyStats = monthNames.slice(0, currentMonth + 1).map((month, index) => {
        const monthRevenues = revenues
          .filter((r) => {
            const d = new Date(r.date_received);
            return d.getMonth() === index && d.getFullYear() === currentYear;
          })
          .reduce((acc, r) => acc + r.amount, 0);

        const monthMissions = missions.filter((m) => {
          const d = new Date(m.start_date || '');
          return d.getMonth() === index && d.getFullYear() === currentYear;
        }).length;

        return { month, revenus: monthRevenues, missions: monthMissions };
      });

      setMonthlyData(monthlyStats);
      setRecentActivity(activityRes.data || []);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Recettes', value: stats.recipes, icon: ChefHat, color: 'bg-primary-500', href: '/admin/recipes' },
    { name: 'Fiches techniques', value: stats.technicalSheets, icon: FileText, color: 'bg-secondary-500', href: '/admin/technical-sheets' },
    { name: 'Menus', value: stats.menus, icon: Menu, color: 'bg-accent-500', href: '/admin/menus' },
    { name: 'Cartes', value: stats.cards, icon: CreditCard, color: 'bg-success-500', href: '/admin/cards' },
  ];

  const secondaryCards = [
    {
      name: 'Missions en cours',
      value: `${stats.missions.inProgress}/${stats.missions.total}`,
      icon: Briefcase,
      change: '+2 cette semaine',
      positive: true,
    },
    {
      name: 'Revenus ce mois',
      value: formatCurrency(stats.revenues.thisMonth),
      icon: Euro,
      change: stats.revenues.thisMonth > stats.revenues.total / 12 ? 'Au-dessus de la moyenne' : 'En dessous de la moyenne',
      positive: stats.revenues.thisMonth > stats.revenues.total / 12,
    },
    {
      name: 'Commentaires en attente',
      value: stats.comments.pending,
      icon: MessageSquare,
      change: stats.comments.pending > 0 ? 'À modérer' : 'Tout est à jour',
      positive: stats.comments.pending === 0,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-display font-bold text-neutral-900">Tableau de bord</h1>
        <p className="text-neutral-500">Bienvenue dans votre espace d'administration</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <a
            key={stat.name}
            href={stat.href}
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-neutral-500">{stat.name}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {secondaryCards.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-neutral-600" />
              </div>
              {stat.positive ? (
                <span className="flex items-center text-xs text-success-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Bon
                </span>
              ) : (
                <span className="flex items-center text-xs text-warning-600">
                  <Clock className="w-4 h-4 mr-1" />
                  Attention
                </span>
              )}
            </div>
            <p className="text-2xl font-display font-bold text-neutral-900">{stat.value}</p>
            <p className="text-sm text-neutral-500">{stat.name}</p>
            <p className={`text-xs mt-2 ${stat.positive ? 'text-success-600' : 'text-warning-600'}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Évolution des revenus</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#18181b' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenus"
                  stroke="#ed7512"
                  fill="#ed7512"
                  fillOpacity={0.1}
                  name="Revenus"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Missions Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Missions par mois</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="missions" fill="#35906a" name="Missions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-6 border-b border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900">Activité récente</h3>
        </div>
        <div className="divide-y divide-neutral-100">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-800">{activity.action}</p>
                  <p className="text-xs text-neutral-500">{formatDate(activity.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-neutral-500">
              Aucune activité récente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
