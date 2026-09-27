import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { RouterProvider } from 'react-router/dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/auth-provider';
import { queryClient } from '@/shared/lib/query-client';
import { ConfirmProvider } from '@/shared/ui/dialog';
import { router } from './router';

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
  : () => null;

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <Suspense>
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </Suspense>
    </QueryClientProvider>
  );
}
