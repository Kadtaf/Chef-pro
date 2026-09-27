import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toUserMessage } from './errors';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Toast shown on success. */
      successMessage?: string;
      /** Set to false when the component handles the error itself. */
      toastOnError?: boolean;
    };
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => failureCount < 2 && (error as { code?: string }).code !== 'PGRST116',
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.successMessage) toast.success(mutation.meta.successMessage);
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.toastOnError !== false) toast.error(toUserMessage(error));
    },
  }),
});
