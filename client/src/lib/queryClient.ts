import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  merchant: {
    profile: ['merchant', 'profile'],
    dashboard: ['merchant', 'dashboard'],
    services: (filters = {}) => ['merchant', 'services', filters],
    service: (id: string) => ['merchant', 'service', id],
    categories: ['merchant', 'service-categories'],
    bookings: (filters = {}) => ['merchant', 'bookings', filters],
    customers: (filters = {}) => ['merchant', 'customers', filters],
    transactions: (filters = {}) => ['merchant', 'transactions', filters],
    payments: (filters = {}) => ['merchant', 'payments', filters],
    invoices: (filters = {}) => ['merchant', 'invoices', filters],
    staff: ['merchant', 'staff'],
    locations: ['merchant', 'locations'],
    availability: ['merchant', 'availability'],
    reviews: ['merchant', 'reviews'],
    financial: ['merchant', 'financial'],
    settings: ['merchant', 'settings'],
  },
  admin: {
    dashboard: ['admin', 'dashboard'],
    merchants: (filters = {}) => ['admin', 'merchants', filters],
    users: (filters = {}) => ['admin', 'users', filters],
    bookings: (filters = {}) => ['admin', 'bookings', filters],
    customers: (filters = {}) => ['admin', 'customers', filters],
    transactions: (filters = {}) => ['admin', 'transactions', filters],
    payouts: (filters = {}) => ['admin', 'payouts', filters],
    refunds: (filters = {}) => ['admin', 'refunds', filters],
    risk: (filters = {}) => ['admin', 'risk', filters],
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
