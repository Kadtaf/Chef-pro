import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { NotFoundContent } from '@/features/public-site/not-found';
import { reportError } from '@/shared/lib/monitoring';
import { Button } from '@/shared/ui/button';

function isChunkLoadError(error: unknown) {
  return (
    error instanceof Error &&
    /Failed to fetch dynamically imported module|Importing a module script failed/.test(error.message)
  );
}

/** Router-level error boundary: 404s, stale deployments and unexpected crashes. */
export function RouteError() {
  const error = useRouteError();

  useEffect(() => {
    if (!isRouteErrorResponse(error)) reportError(error);
  }, [error]);

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundContent />;

  const staleDeployment = isChunkLoadError(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
      <AlertTriangle className="size-12 text-error-500" aria-hidden />
      <h1 className="text-2xl font-bold text-neutral-900">
        {staleDeployment ? 'Une nouvelle version est disponible' : 'Une erreur est survenue'}
      </h1>
      <p className="max-w-md text-neutral-600">
        {staleDeployment
          ? 'Rechargez la page pour utiliser la dernière version du site.'
          : "L'incident a été signalé. Vous pouvez réessayer ou revenir à l'accueil."}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>Recharger</Button>
        <Button asChild variant="subtle">
          <Link to="/">Accueil</Link>
        </Button>
      </div>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="mt-6 max-w-3xl overflow-auto rounded-lg bg-neutral-900 p-4 text-left text-xs text-neutral-100">
          {error.stack}
        </pre>
      )}
    </div>
  );
}
