import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds default stale time
      gcTime: 1000 * 60 * 10, // 10 minutes cache retention
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
