import { ChefHat } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/shared/ui/feedback';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-linear-to-br from-neutral-100 to-neutral-200">
      <aside className="hidden flex-col justify-between bg-linear-to-br from-primary-600 to-secondary-600 p-12 lg:flex lg:w-1/2">
        <div className="flex items-center gap-3 text-white">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <ChefHat className="size-7" aria-hidden />
          </div>
          <span className="font-display text-xl font-bold">Chef Pro Bordeaux</span>
        </div>
        <div className="text-white">
          <p className="mb-4 font-display text-4xl font-bold">
            Administrez votre <br />
            activité culinaire
          </p>
          <p className="text-lg text-white/80">
            Recettes, fiches techniques, missions, revenus et plus encore depuis une seule interface.
          </p>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} Chef Pro Bordeaux</p>
      </aside>

      <main className="flex w-full items-center justify-center p-6 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-secondary-600">
              <ChefHat className="size-7 text-white" aria-hidden />
            </div>
            <span className="font-display text-xl font-bold text-neutral-800">Chef Pro Bordeaux</span>
          </div>

          <Card className="p-8">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold text-neutral-900">{title}</h1>
              <p className="text-neutral-500">{subtitle}</p>
            </div>
            {children}
          </Card>

          <p className="mt-6 text-center">
            <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700">
              ← Retour au site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
