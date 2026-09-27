import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { pageItems } from '@/shared/lib/pagination';
import { Button } from './button';

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  return (
    <nav
      className="flex flex-col items-center justify-between gap-4 text-sm text-neutral-600 sm:flex-row"
      aria-label="Pagination"
    >
      <p>
        {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="subtle"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          <ChevronLeft />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        {/* Numbered pages from the sm breakpoint; a compact counter on phones. */}
        <span className="px-2 sm:hidden" aria-current="page">
          {page + 1} / {pageCount}
        </span>
        <ul className="hidden items-center gap-1 sm:flex">
          {pageItems(page, pageCount).map((item, index) =>
            item === null ? (
              <li key={`gap-${index}`} className="px-1 text-neutral-400" aria-hidden>
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item + 1}`}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full font-medium tabular-nums transition-colors',
                    item === page
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-700',
                  )}
                >
                  {item + 1}
                </button>
              </li>
            ),
          )}
        </ul>

        <Button
          variant="subtle"
          size="sm"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
