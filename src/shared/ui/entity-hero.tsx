import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { imageUrl } from '@/shared/lib/storage';

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1600';

/** Full-bleed image header with gradient, badges, title and description. */
export function EntityHero({
  image,
  title,
  description,
  badges,
  top,
  className,
  titleAs: Title = 'h1',
}: {
  image: string | null | undefined;
  title: string;
  description?: string | null;
  badges?: ReactNode;
  top?: ReactNode;
  className?: string;
  titleAs?: 'h1' | 'h2';
}) {
  return (
    <section
      className={cn('relative h-[42vh] min-h-80 overflow-hidden rounded-2xl print:h-auto print:min-h-0', className)}
    >
      <img
        src={imageUrl(image, 1600) ?? FALLBACK_IMAGE}
        alt=""
        className="size-full object-cover print:hidden"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-linear-to-t from-neutral-900/90 via-neutral-900/40 to-transparent print:hidden" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 print:static print:p-0">
        <div className="max-w-5xl">
          {top}
          {badges && <div className="mb-4 flex flex-wrap items-center gap-2">{badges}</div>}
          <Title className="mb-3 text-3xl font-bold text-white md:text-5xl print:text-neutral-900">{title}</Title>
          {description && <p className="max-w-3xl text-lg text-white/85 print:text-neutral-700">{description}</p>}
        </div>
      </div>
    </section>
  );
}

export function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur print:border print:text-neutral-800">
      {children}
    </span>
  );
}
