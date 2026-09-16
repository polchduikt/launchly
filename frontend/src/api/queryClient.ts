import { QueryClient } from '@tanstack/react-query';
import { registerAuthCleanup } from '../store/authCleanup';

export const queryClient = new QueryClient({
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
