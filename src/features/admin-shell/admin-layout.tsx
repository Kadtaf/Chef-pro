import {
  Award,
  BookOpen,
  ChartColumn,
  Images,
  Tag,
  Bell,
  Brain,
  Briefcase,
  ChefHat,
  ClipboardCheck,
  CreditCard,
  Euro,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu as MenuIcon,
  MessageSquare,
  Settings,
  Tags,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useNavigation } from 'react-router';
import { useAuth } from '@/features/auth/use-auth';
import { useMarkNotificationsRead, useUnreadMessagesCount, useUnreadNotifications } from '@/features/notifications/api';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { PageLoader } from '@/shared/ui/feedback';
import { ScrollToTop } from '@/shared/ui/scroll-to-top';

type NavItem = { name: string; to: string; icon: LucideIcon; end?: boolean; badge?: number };

function useNavigationItems(): { title: string; items: NavItem[] }[] {
  const { data: unreadMessages = 0 } = useUnreadMessagesCount();
  return [
    {
      title: 'Pilotage',
      items: [{ name: 'Tableau de bord', to: '/admin', icon: LayoutDashboard, end: true }],
    },
    {
      title: 'Blog culinaire',
      items: [
        { name: 'Recettes', to: '/admin/recipes', icon: ChefHat },
        { name: 'Studio IA', to: '/admin/ai-studio', icon: Brain },
        { name: 'Techniques & conseils', to: '/admin/articles', icon: BookOpen },
        { name: 'Catégories & tags', to: '/admin/taxonomy', icon: Tags },
        { name: 'Médiathèque', to: '/admin/media', icon: Images },
        { name: 'Statistiques', to: '/admin/blog-stats', icon: ChartColumn },
      ],
    },
    {
      title: 'Cuisine pro',
      items: [
        { name: 'Fiches techniques', to: '/admin/technical-sheets', icon: FileText },
        { name: 'Menus', to: '/admin/menus', icon: UtensilsCrossed },
        { name: 'Cartes', to: '/admin/cards', icon: CreditCard },
        { name: 'HACCP', to: '/admin/haccp', icon: ClipboardCheck },
      ],
    },
    {
      title: 'Activité',
      items: [
        { name: 'Missions', to: '/admin/missions', icon: Briefcase },
        { name: 'Revenus', to: '/admin/revenues', icon: Euro },
      ],
    },
    {
      title: 'Site public',
      items: [
        { name: 'Messages', to: '/admin/messages', icon: Mail, badge: unreadMessages },
        { name: 'Avis', to: '/admin/comments', icon: MessageSquare },
        { name: 'Parcours du Chef', to: '/admin/career', icon: Award },
        { name: 'Prestations & tarifs', to: '/admin/services', icon: Tag },
        { name: 'Paramètres', to: '/admin/settings', icon: Settings },
      ],
    },
  ];
}

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const groups = useNavigationItems();
  const initial = (profile?.full_name ?? user?.email ?? 'A').charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <Link to="/admin" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-primary-500 to-secondary-600">
            <ChefHat className="size-5 text-white" aria-hidden />
          </div>
          <span className="font-display font-bold text-neutral-900">Chef Pro · Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6" aria-label="Navigation administration">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary-50 font-medium text-primary-700'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                      )
                    }
                  >
                    <item.icon className="size-5" aria-hidden />
                    <span className="flex-1">{item.name}</span>
                    {!!item.badge && (
                      <span className="rounded-full bg-error-500 px-2 py-0.5 text-xs font-medium text-white">
                        {item.badge}
                        <span className="sr-only"> non lus</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-secondary-600 font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900">{profile?.full_name ?? 'Administrateur'}</p>
            <p className="truncate text-xs text-neutral-500">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Se déconnecter"
            onClick={async () => {
              await signOut();
              await navigate('/login');
            }}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationsMenu() {
  const { data: notifications = [] } = useUnreadNotifications();
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${notifications.length})`}>
          <Bell />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-error-500 text-[10px] text-white">
              {notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg data-[state=open]:animate-slide-down"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 p-4">
            <p className="font-semibold text-neutral-900">Notifications</p>
            {notifications.length > 0 && (
              <button
                type="button"
                className="text-xs text-primary-600 hover:underline"
                onClick={() => markRead.mutate(notifications.map((n) => n.id))}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-neutral-500">Aucune notification</p>
            ) : (
              notifications.map((n) => (
                <DropdownMenu.Item
                  key={n.id}
                  className="cursor-pointer border-b border-neutral-50 p-4 outline-none data-[highlighted]:bg-neutral-50"
                  onSelect={() => {
                    markRead.mutate([n.id]);
                    if (n.link) void navigate(n.link);
                  }}
                >
                  <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                  {n.message && <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{n.message}</p>}
                  <p className="mt-1 text-[11px] text-neutral-400">{formatDateTime(n.created_at)}</p>
                </DropdownMenu.Item>
              ))
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function Component() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigation();

  return (
    <div className="min-h-screen bg-neutral-100">
      <meta name="robots" content="noindex, nofollow" />
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-white transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-4 right-3 lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        >
          <X />
        </Button>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-hidden onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Ouvrir le menu"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </Button>
          <div className="flex-1" />
          <NotificationsMenu />
          <Button asChild variant="ghost" size="sm">
            <Link to="/" target="_blank" rel="noreferrer">
              Voir le site
              <ExternalLink />
            </Link>
          </Button>
        </header>

        {navigation.state === 'loading' && (
          <div
            className="fixed top-0 right-0 left-0 z-50 h-0.5 animate-pulse bg-primary-500"
            role="progressbar"
            aria-label="Chargement"
          />
        )}

        <main id="admin-main" tabIndex={-1} className="mx-auto max-w-7xl p-4 outline-none sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <ScrollToTop />
      </div>
    </div>
  );
}
