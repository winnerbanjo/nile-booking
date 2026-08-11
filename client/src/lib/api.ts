import type {
  User,
  Service,
  Schedule,
  WeeklySchedule,
  UnavailableDate,
  ProviderWithServices,
  Booking,
  BookingStats,
  Transaction,
} from '../types';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, '')
  : isLocalhost
    ? '/api'
    : 'https://api.nilebooking.co/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use a longer timeout for auth endpoints to handle cold starts in production.
  const isAuthEndpoint = endpoint.startsWith('/auth/');
  const timeoutMs = isAuthEndpoint ? 45000 : 20000;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Equivalent to withCredentials: true in axios
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new ApiError(response.status, error.message || 'Request failed');
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout - connection took too long');
    }
    throw error;
  }
};

// Auth API
export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    phone?: string;
    country?: string;
  }) => {
    const response = await request<{
      message: string;
      email: string;
      requiresOtp: boolean;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  verifyOtp: async (email: string, otpCode: string) => {
    const response = await request<{
      _id: string;
      name: string;
      email: string;
      role: string;
      slug: string;
      businessName: string;
      token: string;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return { data: response };
  },

  resendOtp: async (email: string) => {
    return await request<{ message: string }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  forgotPassword: async (email: string) => {
    return await request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (data: { email: string; otpCode: string; newPassword: string }) => {
    return await request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    const response = await request<{
      _id: string;
      name: string;
      email: string;
      role: string;
      slug: string;
      businessName: string;
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  adminLogin: async (password: string) => {
    const response = await request<{
      _id: string;
      name: string;
      email: string;
      role: string;
      token: string;
    }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  getMe: async () => {
    return request<User>('/auth/me');
  },

  updateProfile: async (data: {
    businessName?: string;
    bio?: string;
    location?: string;
    profileImage?: string;
  }) => {
    return request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  updateOnboarding: async (data: {
    firstServiceAdded?: boolean;
    firstServiceSkipped?: boolean;
    availabilityConfigured?: boolean;
    onboardingCompleted?: boolean;
    setupChecklistDismissed?: boolean;
  }) => {
    return request<{ onboarding: any }>('/auth/onboarding', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Schedule API
export const scheduleApi = {
  getSchedule: async () => {
    return request<Schedule>('/schedule');
  },

  updateSchedule: async (data: {
    weeklySchedule?: WeeklySchedule;
    bufferTime?: number;
    timezone?: string;
    unavailableDates?: UnavailableDate[];
  }) => {
    return request<Schedule>('/schedule', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getScheduleBySlug: async (slug: string) => {
    return request<Schedule>(`/schedule/provider/${slug}`);
  },
};

// Category API
export const categoryApi = {
  getCategories: async () => {
    return await request<{ success: boolean; data: any[]; count: number }>('/service-categories');
  },
  createCategory: async (data: { name: string; description?: string; isActive?: boolean }) => {
    return await request<{ success: boolean; data: any; message: string }>('/service-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getCategory: async (id: string) => {
    return await request<{ success: boolean; data: any }>(`/service-categories/${id}`);
  },
  updateCategory: async (id: string, data: any) => {
    return await request<{ success: boolean; data: any; message: string }>(`/service-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteCategory: async (id: string, actionData?: { action: 'delete' | 'move' | 'uncategorize'; targetCategoryId?: string }) => {
    return await request<{ success: boolean; message: string }>(`/service-categories/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(actionData || {}),
    });
  },
  reorderCategories: async (categories: { id: string; sortOrder: number }[]) => {
    return await request<{ success: boolean; message: string }>('/service-categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ categories }),
    });
  },
};

// Service API
export const serviceApi = {
  getServices: async () => {
    return request<Service[]>('/services');
  },

  getService: async (id: string) => {
    return request<Service>(`/services/${id}`);
  },

  createService: async (data: {
    name: string;
    description: string;
    category: string;
    price: number;
    duration: number;
    capacity?: number;
    images?: Array<{ url: string; alt?: string }>;
    location?: any;
    features?: string[];
  }) => {
    return request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateService: async (id: string, data: Partial<Service>) => {
    return request<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteService: async (id: string) => {
    return request<{ message: string }>(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  getServicesBySlug: async (slug: string) => {
    return request<ProviderWithServices>(`/services/provider/${slug}`);
  },
};

// Booking API
export const bookingApi = {
  createBooking: async (data: {
    customer: { name: string; email: string; phone: string };
    serviceId: string;
    providerSlug?: string;
    date: string;
    timeSlot: { startTime: string; endTime: string };
    paymentType: 'full' | 'deposit' | 'pay_later' | 'bank_transfer';
    paymentGateway?: 'paystack' | 'flutterwave';
    notes?: string;
    receiptImage?: string;
  }) => {
    return request<{ booking: Booking; paymentData: any }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBookings: async (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<{ bookings: Booking[]; totalPages: number; currentPage: number; total: number }>(
      `/bookings?${query.toString()}`
    );
  },

  getBooking: async (id: string) => {
    return request<Booking>(`/bookings/${id}`);
  },

  updateBookingStatus: async (id: string, status: string) => {
    return request<Booking>(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getBookingStats: async () => {
    return request<BookingStats>('/bookings/stats');
  },
};

// Payment API
export const paymentApi = {
  verifyPaystack: async (reference: string) => {
    return request<{ success: boolean; booking?: Booking }>('/payments/paystack/verify', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  },

  verifyFlutterwave: async (transactionId: string) => {
    return request<{ success: boolean; booking?: Booking }>('/payments/flutterwave/verify', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId }),
    });
  },

  getBanks: async () => {
    return request<{ status: boolean; data: Array<{ name: string; code: string; slug: string }> }>('/payments/banks');
  },

  verifyBankAccount: async (accountNumber: string, bankCode: string) => {
    return request<{ success: boolean; accountName?: string; message: string }>('/payments/verify-bank', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, bankCode }),
    });
  },

  getTransactions: async (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<{ transactions: any[]; totalPages: number; currentPage: number; total: number }>(
      `/payments/transactions?${query.toString()}`
    );
  },

  verifyManualTransaction: async (transactionId: string) => {
    return request<{ message: string; transaction: any; booking: any }>(`/payments/transactions/${transactionId}/verify`, {
      method: 'PUT',
    });
  },

  processRefund: async (transactionId: string, data: { amount: number; reason?: string }) => {
    return request<{ message: string; transaction: any }>(`/payments/transactions/${transactionId}/refund`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Admin API
const getAdminStats = async () => {
  return request<{
    gmv: number;
    nileRevenue: number;
    pendingTransfers: number;
  }>('/admin/stats');
};

const getProviders = async () => {
  return request<User[]>('/admin/providers');
};

const updateProviderStatus = async (providerId: string, status: string) => {
  return request<User>(`/admin/providers/${providerId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const dashboardApi = {
  getSummary: async () => {
    return request<{
      metrics: {
        totalBookings: number;
        confirmedBookings: number;
        pendingBookings: number;
        totalRevenue: number;
        totalDepositEscrow: number;
        totalCustomers: number;
        activeServices: number;
      };
      recentBookings: Booking[];
      upcomingAppointments: any[];
    }>('/dashboard/summary');
  },
};

export const adminApi = {
  getAdminStats,
  getPendingVerifications: async () => {
    return request<{ bookings: any[]; data: any[]; pagination: any }>('/admin/verifications');
  },
  verifyReceipt: async (bookingId: string, action: 'approve' | 'reject') => {
    return request<{ message: string; booking: Booking }>(`/admin/verifications/${bookingId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
  getProviders,
  updateProviderStatus,
  getBookings: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ data: any[]; pagination: any }>(`/admin/bookings${query ? `?${query}` : ''}`);
  },
  getCustomers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ data: any[]; pagination: any }>(`/admin/customers${query ? `?${query}` : ''}`);
  },
  getTransactions: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ data: any[]; pagination: any }>(`/admin/transactions${query ? `?${query}` : ''}`);
  },
  getPayouts: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ data: any[]; pagination: any }>(`/admin/payouts${query ? `?${query}` : ''}`);
  },
  getRefunds: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ data: any[]; pagination: any }>(`/admin/refunds${query ? `?${query}` : ''}`);
  },
  getSettings: async () => {
    return request<Record<string, any>>('/admin/settings');
  },
  getRisk: async () => {
    return request<{ data: any[]; summary: any; pagination: any }>('/admin/risk');
  },
};

export const staffApi = {
  getStaff: async () => {
    return request<any[]>('/staff');
  },
  createStaff: async (data: {
    name: string;
    email: string;
    password: string;
    roleTitle?: string;
    phone?: string;
    assignedServices?: string[];
  }) => {
    return request<any>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteStaff: async (id: string) => {
    return request<{ message: string }>(`/staff/${id}`, {
      method: 'DELETE',
    });
  },
};

export { ApiError };
