import type {
  User,
  Service,
  Schedule,
  WeeklySchedule,
  UnavailableDate,
  ProviderAvailability,
  ProviderWithServices,
  Booking,
  PublicBooking,
  BookingStats,
  Transaction,
  CustomDomainRecord,
  DomainOverview,
  DomainSuggestion,
  DomainAvailability,
} from '../types';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Vite's dev server proxies `/api` to the local backend. Use that proxy even
// when the preview is opened through a forwarded hostname (Codespaces, tunnels),
// otherwise the browser would call the deployed API instead.
const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, '')
  : import.meta.env.DEV || isLocalhost
    ? '/api'
    : 'https://api.nilebooking.co/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutOverrideMs?: number
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
  const timeoutMs = timeoutOverrideMs || (isAuthEndpoint ? 45000 : 20000);

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
      throw new ApiError(
        response.status,
        error.message || 'Request failed',
        error.code,
        error
      );
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
    logo?: string;
    headerImage?: string;
    socialHandles?: any;
    paymentMethods?: any;
    bankAccount?: any;
    slug?: string;
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
    websitePreviewed?: boolean;
    websiteShared?: boolean;
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
    bookingWindowDays?: number;
    minimumLeadTimeMinutes?: number;
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

// Availability API
export const availabilityApi = {
  getProviderAvailability: async (params: { provider?: string; slug?: string; service: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params.provider) query.append('provider', params.provider);
    if (params.slug) query.append('slug', params.slug);
    query.append('service', params.service);
    if (params.date) query.append('date', params.date);
    return request<ProviderAvailability>(`/availability?${query.toString()}`);
  },
};

// Booking API
export const bookingApi = {
  createBooking: async (data: {
    customer: { name: string; email: string; phone: string };
    serviceId: string;
    providerSlug?: string;
    startAt: string;
    date?: string;
    timeSlot?: { startTime: string; endTime: string };
    paymentType: 'full' | 'deposit' | 'pay_later' | 'bank_transfer';
    paymentGateway?: 'paystack' | 'flutterwave';
    notes?: string;
    receiptImage?: string;
  }, idempotencyKey?: string) => {
    return request<{
      booking: Booking & { publicToken?: string };
      paymentData?: any;
      holdExpiresAt?: string | null;
      portalUrl?: string;
      receiptUpload?: { status: 'uploaded' | 'failed' | 'pending' | 'not_provided'; error?: string };
      idempotent?: boolean;
    }>('/bookings', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      body: JSON.stringify(data),
    }, 60000);
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

  updateBookingStatus: async (id: string, status: string, reason?: string) => {
    return request<Booking>(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    });
  },

  getBookingStats: async () => {
    return request<BookingStats>('/bookings/stats');
  },

  getPublicBooking: async (token: string) => {
    return request<{ booking: PublicBooking }>(`/bookings/public/${encodeURIComponent(token)}`);
  },

  uploadPublicReceipt: async (token: string, receiptImage: string) => {
    return request<{ success: boolean; paymentStatus: string; receipt: { uploaded: boolean; status: string } }>(
      `/bookings/public/${encodeURIComponent(token)}/receipt`,
      { method: 'POST', body: JSON.stringify({ receiptImage }) },
      60000
    );
  },

  cancelPublicBooking: async (token: string, reason?: string) => {
    return request<{ success: boolean; status: string; paymentStatus: string }>(
      `/bookings/public/${encodeURIComponent(token)}/cancel`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    );
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

  verifyManualTransaction: async (
    transactionId: string,
    data: { amountReceived: number; overrideReason?: string; cashAcknowledged?: boolean }
  ) => {
    return request<{ message: string; transaction: any; booking: Booking; alreadyVerified?: boolean; partial?: boolean; confirmationEmail?: any }>(
      `/payments/transactions/${transactionId}/verify`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

  verifyBookingPayment: async (
    bookingId: string,
    data: { amountReceived: number; overrideReason?: string; cashAcknowledged?: boolean }
  ) => {
    return request<{ message: string; transaction: any; booking: Booking; alreadyVerified?: boolean; partial?: boolean; confirmationEmail?: any }>(
      `/payments/bookings/${bookingId}/verify`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
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

const updateProviderPlan = async (
  providerId: string,
  data: { plan: string; planStatus?: string; planExpiresAt?: string | null }
) => {
  return request<{ message: string; provider: any }>(`/admin/providers/${providerId}/plan`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const dashboardApi = {
  getSummary: async () => {
    return request<{
      setup?: {
        accountCreated: boolean;
        websiteGenerated: boolean;
        firstServiceAdded: boolean;
        availabilityConfigured: boolean;
        logoAdded: boolean;
        websitePreviewed: boolean;
        websiteShared: boolean;
      };
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
  verifyReceipt: async (
    bookingId: string,
    action: 'approve' | 'reject',
    data: { amountReceived?: number; overrideReason?: string; reason?: string } = {}
  ) => {
    return request<{ message: string; booking: Booking }>(`/admin/verifications/${bookingId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
    });
  },
  getProviders,
  updateProviderStatus,
  updateProviderPlan,
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

export const domainApi = {
  getOverview: async () => request<DomainOverview>('/domains'),

  getSuggestions: async (keyword: string) =>
    request<{ suggestions: DomainSuggestion[] }>('/domains/suggestions', {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),

  checkAvailability: async (domain: string) =>
    request<DomainAvailability>('/domains/availability', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    }),

  claim: async (data: {
    domain: string;
    acceptedTerms: boolean;
    registrant: {
      firstName: string;
      lastName: string;
      company?: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone: string;
      email: string;
    };
  }) =>
    request<{ success: boolean; message: string; domain: CustomDomainRecord }>('/domains/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 60000),

  connect: async (domain: string) =>
    request<{ success: boolean; message: string; domain: CustomDomainRecord }>('/domains/connect', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    }),

  verify: async (id: string) =>
    request<{ success: boolean; message: string; domain: CustomDomainRecord }>(`/domains/${id}/verify`, {
      method: 'POST',
    }),

  refresh: async (id: string) =>
    request<{ success: boolean; domain: CustomDomainRecord }>(`/domains/${id}/refresh`, {
      method: 'POST',
    }),

  retry: async (id: string) =>
    request<{ success: boolean; domain: CustomDomainRecord }>(`/domains/${id}/retry`, {
      method: 'POST',
    }, 60000),

  renew: async (id: string) =>
    request<{
      success: boolean;
      reference: string;
      amountNGN: number;
      authorizationUrl: string | null;
      accessCode: string | null;
      domain: CustomDomainRecord;
    }>(`/domains/${id}/renew`, { method: 'POST' }),

  verifyRenewal: async (reference: string) =>
    request<{ success: boolean; domain?: CustomDomainRecord; message?: string }>(
      '/domains/renewals/verify',
      { method: 'POST', body: JSON.stringify({ reference }) }
    ),

  remove: async (id: string) =>
    request<{ success: boolean; domain: CustomDomainRecord }>(`/domains/${id}`, {
      method: 'DELETE',
    }),

  getPublicTenant: async (host: string) =>
    request<{ slug: string; businessName: string; logo?: string | null; domain: string }>(
      `/public/tenant?host=${encodeURIComponent(host)}`
    ),
};

// Portfolio API
export const portfolioApi = {
  addItem: async (data: { url: string; alt?: string; caption: string; serviceId?: string | null }) => {
    return request<{ success: boolean; gallery: any[] }>('/auth/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteItem: async (index: number) => {
    return request<{ success: boolean; gallery: any[] }>(`/auth/portfolio/${index}`, {
      method: 'DELETE',
    });
  },
};

// Reviews API
export const reviewApi = {
  submitReview: async (data: {
    providerSlug: string;
    serviceId?: string;
    customerName: string;
    customerEmail: string;
    rating: number;
    comment?: string;
  }) => {
    return request<{ success: boolean; review: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getBySlug: async (slug: string) => {
    return request<{ reviews: any[]; total: number; avgRating: number | null }>(`/reviews/provider/${slug}`);
  },
  getMyReviews: async () => {
    return request<{ reviews: any[]; total: number; avgRating: number | null; breakdown: Record<string, number> }>('/reviews/mine');
  },
  togglePublish: async (id: string) => {
    return request<{ success: boolean; review: any }>(`/reviews/${id}/toggle`, { method: 'PATCH' });
  },
  deleteReview: async (id: string) => {
    return request<{ success: boolean }>(`/reviews/${id}`, { method: 'DELETE' });
  },
};

export { ApiError };

