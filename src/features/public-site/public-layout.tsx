import { ChefHat, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/use-auth';
import { DEFAULT_SETTINGS, useSiteSettings } from '@/features/settings/api';
import { cn } from '@/shared/lib/cn';
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/shared/ui/brand-icons';
import { Button } from '@/shared/ui/button';
import { PageLoader } from '@/shared/ui/feedback';

const NAVIGATION = [
  { name: 'Accueil', to: '/' },
  { name: 'À propos', to: '/a-propos' },
  { name: 'Services', to: '/services' },
  { name: 'Tarifs', to: '/tarifs' },
  { name: 'Portfolio', to: '/portfolio' },
  { name: 'Recettes', to: '/recettes' },
  { name: 'Avis', to: '/avis' },
  { name: 'Contact', to: '/contact' },
];

const SERVICES = ['Chef de cuisine', 'Second de cuisine', 'Consulting culinaire', 'Formation', 'Événementiel'];

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  );

export function Component() {
  // The menu is "open for" a given page, so it closes itself on navigation.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const scrolled = useScrolled();
  const location = useLocation();
  const menuOpen = menuOpenOn === location.pathname;
  const { isAdmin } = useAuth();
  const { data: settings } = useSiteSettings();
  const site = { ...DEFAULT_SETTINGS, ...settings };

  const socials = [
    { href: settings?.facebook_url, label: 'Facebook', Icon: FacebookIcon },
    { href: settings?.instagram_url, label: 'Instagram', Icon: InstagramIcon },
    { href: settings?.linkedin_url, label: 'LinkedIn', Icon: LinkedinIcon },
  ].filter((s): s is typeof s & { href: string } => !!s.href);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollRestoration />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:rounded focus:bg-white focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled || menuOpen ? 'bg-white/95 shadow-lg backdrop-blur-lg' : 'bg-white/60 backdrop-blur-sm',
        )}
      >
        <nav
          className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Principale"
        >
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-secondary-600 shadow-lg transition-transform group-hover:scale-105">
              <ChefHat className="size-7 text-white" aria-hidden />
            </div>
            <div>
              <span className="font-display text-xl font-bold text-neutral-800">{site.site_name}</span>
              <p className="text-xs text-neutral-500">Chef de cuisine freelance</p>
            </div>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAVIGATION.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className={navLinkClass}>
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-4 lg:flex">
            {isAdmin && (
              <Link to="/admin" className="text-sm text-neutral-500 hover:text-primary-600">
                Administration
              </Link>
            )}
            <Button asChild size="sm">
              <Link to="/contact">Demander un devis</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpenOn(menuOpen ? null : location.pathname)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </nav>

        {menuOpen && (
          <div id="mobile-menu" className="animate-slide-down border-t border-neutral-100 bg-white lg:hidden">
            <ul className="space-y-1 px-4 py-6">
              {NAVIGATION.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={(s) => cn(navLinkClass(s), 'block py-3 text-base')}
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
              <li className="space-y-3 pt-4">
                {isAdmin && (
                  <Link to="/admin" className="block text-center text-neutral-500">
                    Administration
                  </Link>
                )}
                <Button asChild className="w-full">
                  <Link to="/contact">Demander un devis</Link>
                </Button>
              </li>
            </ul>
          </div>
        )}
      </header>

      <main id="main" className="grow pt-20">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="mt-20 bg-neutral-900 text-neutral-300">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-linear-to-br from-primary-500 to-secondary-600">
                  <ChefHat className="size-5 text-white" aria-hidden />
                </div>
                <span className="font-display text-lg font-bold text-white">{site.site_name}</span>
              </div>
              <p className="text-sm leading-relaxed">{site.site_description}</p>
              {socials.length > 0 && (
                <ul className="flex gap-4">
                  {socials.map(({ href, label, Icon }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="hover:text-primary-400"
                      >
                        <Icon className="size-5" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="mb-4 font-sans font-semibold text-white">Navigation</h2>
              <ul className="space-y-2">
                {NAVIGATION.slice(0, 6).map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-sm hover:text-primary-400">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 font-sans font-semibold text-white">Services</h2>
              <ul className="space-y-2">
                {SERVICES.map((service) => (
                  <li key={service}>
                    <Link to="/services" className="text-sm hover:text-primary-400">
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 font-sans font-semibold text-white">Contact</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <MapPin className="size-4 text-primary-400" aria-hidden />
                  <span>{site.address}</span>
                </li>
                {site.phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="size-4 text-primary-400" aria-hidden />
                    <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-primary-400">
                      {site.phone}
                    </a>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <Mail className="size-4 text-primary-400" aria-hidden />
                  <a href={`mailto:${site.email}`} className="hover:text-primary-400">
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 md:flex-row">
            <p className="text-sm text-neutral-400">
              © {new Date().getFullYear()} {site.site_name}. Tous droits réservés.
            </p>
            <Link to="/mentions-legales" className="text-sm text-neutral-400 hover:text-primary-400">
              Mentions légales &amp; confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
