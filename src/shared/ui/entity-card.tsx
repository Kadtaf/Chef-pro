import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { imageUrl } from '@/shared/lib/storage';

/** Card used by admin grids (technical sheets, menus, cards). */
export function EntityCard({
  to,
  image,
  placeholderIcon: Icon,
  title,
  badges,
  meta,
  status,
  actions,
}: {
  to: string;
  image: string | null | undefined;
  placeholderIcon: LucideIcon;
  title: string;
  badges?: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <Link
        to={to}
        className="group block aspect-video overflow-hidden bg-linear-to-br from-primary-100 to-secondary-100"
        tabIndex={-1}
      >
        {image ? (
          <img
            src={imageUrl(image, 640)}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <Icon className="size-14 text-primary-300" aria-hidden />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {badges && <div className="mb-2 flex flex-wrap items-center justify-between gap-2">{badges}</div>}
        <h2 className="mb-2 font-sans text-base font-semibold text-neutral-900">
          <Link to={to} className="hover:text-primary-700">
            {title}
          </Link>
        </h2>
        {meta && <div className="mb-4 flex-1 text-sm text-neutral-500">{meta}</div>}
        <div className="mt-auto flex items-center justify-between gap-2">
          {status}
          <div className="flex gap-1">{actions}</div>
        </div>
      </div>
    </article>
  );
}
