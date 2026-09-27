import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

/** Dark hero used at the top of inner public pages. */
export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-neutral-900 to-neutral-800 py-20 md:py-24">
      <Container className="relative text-center">
        <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">{title}</h1>
        {subtitle && <p className="mx-auto max-w-2xl text-lg text-neutral-300 md:text-xl">{subtitle}</p>}
      </Container>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  className,
}: {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <div className={cn('mb-12 md:mb-16', align === 'center' && 'text-center', className)}>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className={cn('section-subtitle', align === 'center' && 'mx-auto')}>{subtitle}</p>}
    </div>
  );
}

/** Gradient call-to-action banner closing most public pages. */
export function CtaBanner({
  title,
  text,
  primary = { label: 'Demander un devis', to: '/contact' },
  secondary,
}: {
  title: string;
  text: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="bg-linear-to-br from-primary-600 to-secondary-600 py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">{title}</h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80">{text}</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to={primary.to}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-semibold text-primary-700 transition-colors hover:bg-neutral-100"
          >
            {primary.label}
            <ArrowRight className="size-5" aria-hidden />
          </Link>
          {secondary && (
            <Link
              to={secondary.to}
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/20"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
