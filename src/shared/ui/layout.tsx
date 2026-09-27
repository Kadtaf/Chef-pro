import { ArrowLeft, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';
import { Card } from './feedback';
import { Input } from './form';

export function PageHeader({
  title,
  description,
  actions,
  backTo,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {backTo && (
          <Button asChild variant="ghost" size="icon" aria-label="Retour">
            <Link to={backTo}>
              <ArrowLeft />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          {description && <p className="mt-1 text-neutral-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SearchInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
      <Input type="search" className="pl-10" {...props} />
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'primary' | 'secondary' | 'success' | 'warning';
}) {
  const tones = {
    primary: 'bg-primary-100 text-primary-600',
    secondary: 'bg-secondary-100 text-secondary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={cn('flex size-12 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="size-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="truncate text-2xl font-bold text-neutral-900">{value}</p>
          {hint && <p className="text-xs text-neutral-500">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-sm text-neutral-500">{item.label}</dt>
          <dd className="font-medium text-neutral-900">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
