// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  slug?: string;
  businessName?: string;
  phone?: string;
  socialHandles?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  slug?: string;
  businessName?: string;
  token: string;
}

// Service Types
export interface Service {
  _id: string;
  provider: string;
  name: string;
  description: string;
  category: 'cruise' | 'hotel' | 'tour' | 'restaurant' | 'transportation' | 'other';
  price: number;
  duration: number;
  capacity: number;
  images: Array<{ url: string; alt?: string }>;
  location?: {
    name?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  features: string[];
  isActive: boolean;
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Schedule Types
export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface UnavailableDate {
  date: string;
  reason?: string;
}

export interface Schedule {
  _id: string;
  provider: string;
  timezone: string;
  weeklySchedule: WeeklySchedule;
  bufferTime: number;
  unavailableDates: UnavailableDate[];
  createdAt: string;
  updatedAt: string;
}

// Provider Types
export interface Provider {
  _id: string;
  name: string;
  businessName: string;
  slug: string;
  phone?: string;
  bio?: string;
  location?: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    zipCode?: string;
  };
  socialHandles?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  gallery?: Array<{
    url: string;
    alt?: string;
  }>;
  testimonials?: Array<{
    name: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export interface ProviderWithServices {
  provider: Provider;
  services: Service[];
}

// Booking Types
export interface Booking {
  _id: string;
  bookingNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  provider: string | { _id: string; businessName: string; email: string };
  service: Service | string | { _id: string; name: string };
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'pending_verification' | 'partial' | 'paid' | 'refunded';
  paymentType: 'full' | 'deposit' | 'pay_later' | 'bank_transfer';
  pricing: {
    servicePrice: number;
    depositAmount: number;
    totalAmount: number;
    currency: string;
  };
  paymentGateway?: 'paystack' | 'flutterwave' | null;
  paymentReference?: string;
  notes?: string;
  whatsappLink?: string;
  receiptImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export interface Transaction {
  _id: string;
  booking: string;
  provider: string;
  type: 'payment' | 'deposit' | 'refund' | 'payout';
  amount: number;
  currency: string;
  paymentGateway: 'paystack' | 'flutterwave';
  gatewayReference: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  createdAt: string;
}

// Booking Stats Types
export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  pendingPayouts: number;
  successRate: number;
}
