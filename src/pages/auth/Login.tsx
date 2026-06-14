import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChefHat, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRegister) {
      setError('Inscription désactivée. Contactez l\'administrateur.');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setError('Email ou mot de passe incorrect');
    } else {
      navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-neutral-100 to-neutral-200">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-secondary-600 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ChefHat className="w-7 h-7" />
            </div>
            <span className="text-xl font-display font-bold">Chef Pro Bordeaux</span>
          </div>
        </div>

        <div className="text-white">
          <h1 className="text-4xl font-display font-bold mb-4">
            Administrez votre <br />activité culinaire
          </h1>
          <p className="text-lg text-white/80">
            Gérez vos recettes, fiches techniques, missions, <br />
            revenus et plus encore depuis une seule interface.
          </p>
        </div>

        <div className="text-white/60 text-sm">
          © {new Date().getFullYear()} Chef Pro Bordeaux. Tous droits réservés.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-neutral-800">Chef Pro Bordeaux</span>
          </div>

          <div className="card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                {isRegister ? 'Créer un compte' : 'Connexion'}
              </h2>
              <p className="text-neutral-500">
                {isRegister
                  ? 'Créez votre compte administrateur'
                  : 'Connectez-vous à votre espace admin'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label htmlFor="fullName" className="label">Nom complet</label>
                  <div className="relative">
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input pl-11"
                      placeholder="Votre nom"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-11"
                    placeholder="admin@exemple.fr"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">Mot de passe</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-11 pr-11"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full gap-2"
                disabled={loading}
              >
                {loading ? 'Chargement...' : isRegister ? 'Créer le compte' : 'Se connecter'}
                {!loading && <LogIn className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {isRegister
                  ? 'Déjà un compte ? Se connecter'
                  : 'Pas de compte ? Contacter l\'administrateur'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700">
              ← Retour au site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
