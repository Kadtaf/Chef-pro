import { ChefHat } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Seo } from '@/shared/ui/seo';

export function NotFoundContent({
  title = 'Page introuvable',
  backTo = '/',
  backLabel = "Retour à l'accueil",
}: {
  title?: string;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Seo title={title} noindex />
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary-100">
        <ChefHat className="size-10 text-primary-600" aria-hidden />
      </div>
      <div>
        <p className="font-display text-6xl font-bold text-neutral-200">404</p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-2 text-neutral-500">Ce plat n&apos;est pas (ou plus) à la carte.</p>
      </div>
      <Button asChild>
        <Link to={backTo}>{backLabel}</Link>
      </Button>
    </div>
  );
}

export function Component() {
  return <NotFoundContent />;
}
