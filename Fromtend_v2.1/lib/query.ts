import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  rooms: { all: ['rooms'], list: (filters?: any) => ['rooms', 'list', filters] },
  bookings: { all: ['bookings'], list: (filters?: any) => ['bookings', 'list', filters] },
  admin: { users: ['admin', 'users'] },
};
