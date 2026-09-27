import { Heart, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/use-auth';
import { NewsletterSignup } from '@/features/newsletter/newsletter-signup';
import { DEFAULT_SETTINGS, useSiteSettings } from '@/features/settings/api';
import { cn } from '@/shared/lib/cn';
import { useFavorites } from '@/shared/lib/visitor';
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/shared/ui/brand-icons';
import { Button } from '@/shared/ui/button';
import { ToqueIcon } from '@/shared/ui/culinary-icons';
import { PageLoader } from '@/shared/ui/feedback';
import { ScrollToTop } from '@/shared/ui/scroll-to-top';

const PRIMARY_NAV = [
  { name: 'Blog culinaire', to: '/recettes' },
  { name: 'Menus de saison', to: '/menus-de-saison' },
  { name: 'Techniques', to: '/techniques' },
  { name: 'Conseils du Chef', to: '/conseils' },
  { name: 'Le Chef', to: '/a-propos' },
  { name: 'Prestations', to: '/services' },
];

const FOOTER_NAV = [
  {
    title: 'Le blog',
    links: [
      { name: 'Toutes les recettes', to: '/recettes' },
      { name: 'Menus de saison', to: '/menus-de-saison' },
      { name: 'Accords mets-vins', to: '/accords-mets-vins' },
      { name: 'Techniques culinaires', to: '/techniques' },
      { name: 'Conseils du Chef', to: '/conseils' },
      { name: 'Mes favoris', to: '/favoris' },
    ],
  },
  {
    title: 'Le Chef',
    links: [
      { name: 'Parcours', to: '/a-propos' },
      { name: 'Prestations', to: '/services' },
      { name: 'Tarifs', to: '/tarifs' },
      { name: 'Avis clients', to: '/avis' },
      { name: 'Contact', to: '/contact' },
    ],
  },
];

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function Brand({ name, light = false }: { name: string; light?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label={`${name} — accueil`}>
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-full border transition-colors',
          light
            ? 'border-secondary-400/40 text-secondary-300'
            : 'border-primary-700/20 text-primary-700 group-hover:border-secondary-500',
        )}
      >
        <ToqueIcon size={24} />
      </span>
      <span className="leading-none">
        <span className={cn('block font-display text-2xl font-semibold', light ? 'text-cream-50' : 'text-neutral-900')}>
          {name.replace(/ Bordeaux$/, '')}
        </span>
        <span
          className={cn(
            'block text-[0.65rem] font-semibold tracking-[0.35em] uppercase',
            light ? 'text-secondary-300' : 'text-secondary-600',
          )}
        >
          Bordeaux
        </span>
      </span>
    </Link>
  );
}

export function Component() {
  const scrolled = useScrolled();
  const location = useLocation();
  const favorites = useFavorites();
  const { isAdmin } = useAuth();
  const { data: settings } = useSiteSettings();
  const site = { ...DEFAULT_SETTINGS, ...settings };
  // The menu is "open for" a given page, so it closes itself on navigation.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === location.pathname;

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
          'fixed inset-x-0 top-0 z-50 border-b transition-all duration-500',
          scrolled || menuOpen
            ? 'border-neutral-200/70 bg-cream-50/95 shadow-[0_8px_30px_-12px_rgba(28,26,24,0.18)] backdrop-blur-xl'
            : 'border-transparent bg-cream-50/70 backdrop-blur-sm',
        )}
      >
        <nav
          className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
          aria-label="Principale"
        >
          <Brand name={site.site_name} />

          <ul className="hidden items-center gap-1 xl:flex">
            {PRIMARY_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative px-3 py-2 text-sm font-medium tracking-wide transition-colors',
                      'after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:bg-secondary-500 after:transition-transform after:duration-300',
                      isActive
                        ? 'text-primary-700 after:scale-x-100'
                        : 'text-neutral-700 after:scale-x-0 hover:text-primary-700 hover:after:scale-x-100',
                    )
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to="/favoris"
              className="relative flex size-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
              aria-label={`Mes favoris (${favorites.length})`}
            >
              <Heart className="size-5" aria-hidden />
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary-700 text-[10px] font-semibold text-white">
                  {favorites.length}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="hidden text-sm text-neutral-500 hover:text-primary-700 lg:block">
                Administration
              </Link>
            )}
            <Button asChild size="sm" className="hidden rounded-full px-5 sm:inline-flex">
              <Link to="/contact">Réserver le Chef</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMenuOpenOn(menuOpen ? null : location.pathname)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </nav>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="fixed inset-x-0 top-20 bottom-0 animate-fade-in overflow-y-auto bg-neutral-950 px-6 py-10 xl:hidden"
          >
            <ul className="space-y-1">
              {[
                ...PRIMARY_NAV,
                { name: 'Accords mets-vins', to: '/accords-mets-vins' },
                { name: 'Contact', to: '/contact' },
              ].map((item, index) => (
                <li key={item.to} className="animate-slide-up" style={{ animationDelay: `${index * 40}ms` }}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'block border-b border-white/10 py-4 font-display text-3xl',
                        isActive ? 'text-secondary-300' : 'text-cream-50',
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-10 w-full rounded-full bg-secondary-500 text-neutral-950 hover:bg-secondary-400"
            >
              <Link to="/contact">Réserver le Chef</Link>
            </Button>
          </div>
        )}
      </header>

      <main id="main" tabIndex={-1} className="grow pt-20 outline-none">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <ScrollToTop />

      <footer className="bg-neutral-950 text-neutral-400">
        <div className="border-b border-white/10">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <p className="eyebrow text-secondary-400">Newsletter</p>
              <h2 className="mb-3 text-4xl text-cream-50">Les inspirations du Chef</h2>
              <p className="max-w-md">
                Recettes de saison, gestes techniques et secrets de cuisine, une à deux fois par mois. Sans spam.
              </p>
            </div>
            <NewsletterSignup />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-5">
              <Brand name={site.site_name} light />
              <p className="text-sm leading-relaxed">{site.site_description}</p>
              {socials.length > 0 && (
                <ul className="flex gap-3">
                  {socials.map(({ href, label, Icon }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="flex size-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-secondary-400 hover:text-secondary-300"
                      >
                        <Icon className="size-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {FOOTER_NAV.map((column) => (
              <div key={column.title}>
                <h2 className="mb-5 font-sans text-xs font-semibold tracking-[0.25em] text-secondary-400 uppercase">
                  {column.title}
                </h2>
                <ul className="space-y-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="transition-colors hover:text-cream-50">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h2 className="mb-5 font-sans text-xs font-semibold tracking-[0.25em] text-secondary-400 uppercase">
                Contact
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 text-secondary-400" aria-hidden />
                  <span>{site.address}</span>
                </li>
                {site.phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="size-4 text-secondary-400" aria-hidden />
                    <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-cream-50">
                      {site.phone}
                    </a>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <Mail className="size-4 text-secondary-400" aria-hidden />
                  <a href={`mailto:${site.email}`} className="hover:text-cream-50">
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs md:flex-row">
            <p>
              © {new Date().getFullYear()} {site.site_name}. Tous droits réservés.
            </p>
            <Link to="/mentions-legales" className="hover:text-cream-50">
              Mentions légales &amp; confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
