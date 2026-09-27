import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Button } from '@/shared/ui/button';
import { PageLoader } from '@/shared/ui/feedback';
import { useAuth } from './use-auth';

/** Route guard: signed in AND profile role = admin (enforced server-side by RLS too). */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <PageLoader />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-100 p-6 text-center">
        <ShieldAlert className="size-14 text-warning-500" aria-hidden />
        <h1 className="text-2xl font-bold text-neutral-900">Accès réservé</h1>
        <p className="max-w-md text-neutral-600">
          Votre compte ({user.email}) n&apos;a pas les droits administrateur. Contactez le propriétaire du site.
        </p>
        <Button variant="subtle" onClick={() => void signOut()}>
          Se déconnecter
        </Button>
      </div>
    );
  }

  return children;
}
