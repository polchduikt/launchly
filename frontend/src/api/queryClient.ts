import { QueryClient, MutationCache } from '@tanstack/react-query';
import { registerAuthCleanup } from '../store/authCleanup';
import { toast } from '../store/useToastStore';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error: unknown, _variables, _context, mutation) => {
      if (mutation.meta?.skipToast) return;
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'An error occurred';
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

registerAuthCleanup(() => {
  queryClient.clear();
});
