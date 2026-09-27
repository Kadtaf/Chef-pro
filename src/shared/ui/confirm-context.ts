import { createContext, use } from 'react';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
};

export const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/** Promise-based, accessible replacement for window.confirm() (see <ConfirmProvider>). */
export function useConfirm() {
  const confirm = use(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return confirm;
}
