import { AlertTriangle, Inbox, Loader2, type LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { toUserMessage } from '@/shared/lib/errors';
import type { BadgeTone } from '@/shared/domain/constants';
import { Button } from './button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-6 animate-spin text-primary-600', className)} aria-hidden />;
}

export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
      <Spinner className="size-10" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-error-100 bg-error-50 p-8 text-center">
      <AlertTriangle className="size-10 text-error-500" aria-hidden />
      <p className="text-error-700">{toUserMessage(error)}</p>
      {onRetry && (
        <Button variant="subtle" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-white p-12 text-center">
      <Icon className="size-12 text-neutral-300" aria-hidden />
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && <p className="max-w-md text-neutral-500">{description}</p>}
      {action}
    </div>
  );
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-800',
  error: 'bg-error-100 text-error-700',
  info: 'bg-sky-100 text-sky-700',
};

export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm', className)}
      {...props}
    />
  );
}

export function CardSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-sans text-lg font-semibold text-neutral-900">{title}</h2>}
            {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </Card>
  );
}
