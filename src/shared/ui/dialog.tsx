import { X } from 'lucide-react';
import { AlertDialog, Dialog as DialogPrimitive } from 'radix-ui';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';
import { buttonVariants } from './button-variants';

const overlay = 'fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-sm data-[state=open]:animate-fade-in';
const panel =
  'fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-scale-in';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md' }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlay} />
        <DialogPrimitive.Content className={cn(panel, SIZES[size])}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="font-display text-xl font-semibold text-neutral-900">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-neutral-500">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Fermer">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

import { ConfirmContext, type ConfirmOptions } from './confirm-context';

/** Promise-based replacement for window.confirm(), rendered as an accessible alert dialog. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const close = (value: boolean) => {
    resolver.current?.(value);
    setOptions(null);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      <AlertDialog.Root open={options !== null} onOpenChange={(open) => !open && close(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className={overlay} />
          <AlertDialog.Content className={cn(panel, 'max-w-md')}>
            <AlertDialog.Title className="font-display text-xl font-semibold text-neutral-900">
              {options?.title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-neutral-600">
              {options?.description ?? 'Cette action est irréversible.'}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel className={buttonVariants({ variant: 'subtle' })}>Annuler</AlertDialog.Cancel>
              <AlertDialog.Action
                className={buttonVariants({ variant: options?.tone === 'primary' ? 'primary' : 'danger' })}
                onClick={() => close(true)}
              >
                {options?.confirmLabel ?? 'Supprimer'}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext>
  );
}
