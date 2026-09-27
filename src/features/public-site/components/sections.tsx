import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

/** Charcoal editorial hero used at the top of inner public pages. */
export function PageHero({
  title,
  subtitle,
  eyebrow,
  image,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-neutral-950 py-20 md:py-28">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-linear-to-b from-neutral-950/60 via-neutral-950/70 to-neutral-950" />
        </>
      )}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 size-144 -translate-x-1/2 rounded-full bg-primary-700/25 blur-3xl"
        aria-hidden
      />
      <Container className="relative text-center">
        {eyebrow && <p className="eyebrow justify-center text-secondary-400">{eyebrow}</p>}
        <h1 className="mb-6 text-5xl font-medium text-cream-50 md:text-6xl lg:text-7xl">{title}</h1>
        <div className="gold-rule mb-6" />
        {subtitle && <p className="mx-auto max-w-2xl text-lg text-neutral-300 md:text-xl">{subtitle}</p>}
        {children}
      </Container>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  align = 'center',
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <div className={cn('mb-12 md:mb-16', align === 'center' && 'text-center', className)}>
      {eyebrow && <p className={cn('eyebrow', align === 'center' && 'justify-center')}>{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className={cn('section-subtitle', align === 'center' && 'mx-auto')}>{subtitle}</p>}
    </div>
  );
}

/** Deep bordeaux call-to-action banner closing most public pages. */
export function CtaBanner({
  title,
  text,
  primary = { label: 'Réserver le Chef', to: '/contact' },
  secondary,
}: {
  title: string;
  text: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="relative overflow-hidden bg-primary-900 py-20 md:py-24">
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border border-secondary-500/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-32 -left-16 size-96 rounded-full border border-secondary-500/10"
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-6 text-4xl text-cream-50 md:text-5xl">{title}</h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-100/80">{text}</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to={primary.to}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary-500 px-8 py-4 font-semibold text-neutral-950 transition-colors hover:bg-secondary-400"
          >
            {primary.label}
            <ArrowRight className="size-5" aria-hidden />
          </Link>
          {secondary && (
            <Link
              to={secondary.to}
              className="inline-flex items-center justify-center rounded-full border border-cream-50/30 px-8 py-4 font-semibold text-cream-50 transition-colors hover:bg-cream-50/10"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
