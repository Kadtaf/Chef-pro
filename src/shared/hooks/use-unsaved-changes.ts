import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { useConfirm } from '@/shared/ui/confirm-context';

/** Warns before leaving a form with unsaved changes (in-app navigation and tab close). */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const confirm = useConfirm();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    void confirm({
      title: 'Quitter sans enregistrer ?',
      description: 'Vos modifications seront perdues.',
      confirmLabel: 'Quitter',
    }).then((leave) => (leave ? blocker.proceed() : blocker.reset()));
  }, [blocker, confirm]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);
}
