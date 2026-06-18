import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    ChefHat,
    FileText,
    Menu,
    CreditCard,
    ClipboardCheck,
    Briefcase,
    Euro,
    MessageSquare,
    FolderOpen,
    Settings,
    Brain,
    LogOut,
    Menu as MenuIcon,
    X,
    Bell,
    ChevronDown,
    Mail,
} from 'lucide-react';
import { supabase, Tables } from '../../lib/supabase';

interface NavItem {
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    badge?: number;
}

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
    const { user, profile, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<Tables<'notifications'>[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const navigation: NavItem[] = [
        { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
        { name: 'Recettes', href: '/admin/recipes', icon: ChefHat },
        { name: 'Fiches techniques', href: '/admin/technical-sheets', icon: FileText },
        { name: 'Menus', href: '/admin/menus', icon: Menu },
        { name: 'Cartes', href: '/admin/cards', icon: CreditCard },
        { name: 'HACCP', href: '/admin/haccp', icon: ClipboardCheck },
        { name: 'Missions', href: '/admin/missions', icon: Briefcase },
        { name: 'Revenus', href: '/admin/revenues', icon: Euro },
        { name: 'Commentaires', href: '/admin/comments', icon: MessageSquare },
        { name: 'Portfolio', href: '/admin/portfolio', icon: FolderOpen },
        { name: 'IA Studio', href: '/admin/ai-studio', icon: Brain },
        { name: 'Messages', href: '/admin/contact-submissions', icon: Mail, badge: unreadCount },
        { name: 'Paramètres', href: '/admin/settings', icon: Settings },
    ];

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                setNotifications(data);
                setUnreadCount(data.length);
            }
        };

        fetchNotifications();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-neutral-100">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-neutral-200 transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-20 flex items-center justify-between px-6 border-b border-neutral-200">
                        <Link to="/admin" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                                <ChefHat className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-display font-bold text-neutral-900">Admin</span>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-4">
                        <ul className="space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                            isActive(item.href)
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="flex-1">{item.name}</span>
                                        {item.badge && item.badge > 0 && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-error-500 text-white rounded-full">
                        {item.badge}
                      </span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User */}
                    <div className="p-4 border-t border-neutral-200">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-semibold">
                                {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900 truncate">
                                    {profile?.full_name || 'Admin'}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                                title="Déconnexion"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Top Bar */}
                <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
                    >
                        <MenuIcon className="w-5 h-5 text-neutral-600" />
                    </button>

                    <div className="flex-1" />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-neutral-100"
                        >
                            <Bell className="w-5 h-5 text-neutral-600" />
                            {notifications.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden animate-slide-down">
                                <div className="p-4 border-b border-neutral-100">
                                    <h3 className="font-semibold text-neutral-900">Notifications</h3>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className="p-4 border-b border-neutral-50 hover:bg-neutral-50"
                                            >
                                                <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                                                {n.message && (
                                                    <p className="text-xs text-neutral-500 mt-1">{n.message}</p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-neutral-500 text-sm">
                                            Aucune notification
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu (top bar) */}
                    <div className="relative ml-4">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100"
                        >
              <span className="text-sm text-neutral-700">
                {profile?.full_name || user?.email}
              </span>
                            <ChevronDown className="w-4 h-4 text-neutral-500" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200">
                                <button
                                    onClick={handleSignOut}
                                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                >
                                    Déconnexion
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Back to site */}
                    <Link
                        to="/"
                        className="ml-4 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                        Voir le site →
                    </Link>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
}
