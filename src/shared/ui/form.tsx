import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

const controlBase =
  'w-full rounded-lg border border-neutral-200 bg-white px-4 text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-100 aria-invalid:border-error-500 aria-invalid:focus:ring-error-500';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlBase, 'h-11', className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(controlBase, 'py-3', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(controlBase, 'h-11 pr-10', className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  // eslint-disable-next-line jsx-a11y/label-has-associated-control -- used with htmlFor by Field
  return <label className={cn('mb-1.5 block text-sm font-medium text-neutral-700', className)} {...props} />;
}

export function Checkbox({ label, className, ...props }: ComponentProps<'input'> & { label: ReactNode }) {
  const id = useId();
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        id={props.id ?? id}
        type="checkbox"
        className="size-4 rounded border-neutral-300 accent-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500"
        {...props}
      />
      <label htmlFor={props.id ?? id} className="text-sm text-neutral-700 select-none">
        {label}
      </label>
    </div>
  );
}

type FieldProps = {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /** Receives the generated id and ARIA props to spread on the control. */
  children: (control: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
};

/** Label + control + hint + error, wired together for accessibility. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-error-600" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-error-600" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-neutral-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
