import { MailCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Seo } from '@/shared/ui/seo';

/** Landing page of the Brevo double opt-in confirmation link. */
export function Component() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream-100 px-4 py-24">
      <Seo title="Inscription confirmée" noindex />
      <div className="max-w-xl text-center">
        <MailCheck className="mx-auto mb-6 size-14 text-secondary-500" aria-hidden />
        <p className="eyebrow">Les inspirations du Chef</p>
        <h1 className="mb-4 text-5xl text-neutral-900">Bienvenue à table !</h1>
        <p className="mb-8 text-lg text-neutral-600">
          Votre inscription est confirmée. Vous recevrez prochainement recettes de saison, techniques et conseils du
          Chef.
        </p>
        <Button asChild>
          <Link to="/recettes">Découvrir le blog culinaire</Link>
        </Button>
      </div>
    </section>
  );
}
