import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <nav className="flex items-center justify-between gap-4 text-sm text-neutral-600" aria-label="Pagination">
      <p>
        {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="subtle" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft />
          Précédent
        </Button>
        <span aria-current="page">
          {page + 1} / {pageCount}
        </span>
        <Button variant="subtle" size="sm" disabled={page >= pageCount - 1} onClick={() => onPageChange(page + 1)}>
          Suivant
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
