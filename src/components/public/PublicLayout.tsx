import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  ChefHat,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { settings } = useSettings();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'À Propos', href: '/a-propos' },
    { name: 'Services', href: '/services' },
    { name: 'Tarifs', href: '/tarifs' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Recettes', href: '/recettes' },
    { name: 'Avis', href: '/avis' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-lg'
            : 'bg-white/60 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-display font-bold text-neutral-800">
                  {settings?.site_name || 'Chef Pro Bordeaux'}
                </span>
                <p className="text-xs text-neutral-500">Chef de cuisine freelance</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Admin Link & CTA */}
            <div className="hidden lg:flex items-center gap-4">
              {user && (
                <Link
                  to="/admin"
                  className="text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  Administration
                </Link>
              )}
              <Link
                to="/contact"
                className="btn-primary text-sm"
              >
                Demander un devis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-neutral-600" />
              ) : (
                <Menu className="w-6 h-6 text-neutral-600" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-neutral-100 animate-slide-down">
            <div className="px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-3">
                {user && (
                  <Link
                    to="/admin"
                    className="block text-center text-neutral-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administration
                  </Link>
                )}
                <Link
                  to="/contact"
                  className="block btn-primary text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Demander un devis
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-display font-bold text-white">
                  {settings?.site_name || 'Chef Pro Bordeaux'}
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Chef de cuisine freelance à Bordeaux. Second de cuisine, consultant culinaire
                et chef à domicile pour vos événements.
              </p>
              <div className="flex gap-4">
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {settings?.linkedin_url && (
                  <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-white font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2">
                {navigation.slice(0, 5).map((item) => (
                  <li key={item.name}>
                    <Link to={item.href} className="text-sm hover:text-primary-400 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link to="/services" className="text-sm hover:text-primary-400 transition-colors">Chef de cuisine</Link></li>
                <li><Link to="/services" className="text-sm hover:text-primary-400 transition-colors">Second de cuisine</Link></li>
                <li><Link to="/services" className="text-sm hover:text-primary-400 transition-colors">Consulting culinaire</Link></li>
                <li><Link to="/services" className="text-sm hover:text-primary-400 transition-colors">Formation</Link></li>
                <li><Link to="/services" className="text-sm hover:text-primary-400 transition-colors">Événementiel</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">{settings?.address || 'Bordeaux, France'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary-400" />
                  <a href={`tel:${settings?.phone}`} className="text-sm hover:text-primary-400 transition-colors">
                    {settings?.phone || '+33 6 00 00 00 00'}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary-400" />
                  <a href={`mailto:${settings?.email}`} className="text-sm hover:text-primary-400 transition-colors">
                    {settings?.email || 'contact@chef-pro-bordeaux.fr'}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              © {new Date().getFullYear()} {settings?.site_name || 'Chef Pro Bordeaux'}. Tous droits réservés.
            </p>
            <Link to="/mentions-legales" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
              Mentions légales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
