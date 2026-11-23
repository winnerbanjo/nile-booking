// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  slug?: string;
  businessName?: string;
  phone?: string;
  bio?: string;
  location?: string;
  logo?: string;
  profileImage?: string;
  headerImage?: string;
  socialHandles?: {
    instagram?: string;
    whatsapp?: string;
    twitter?: string;
    facebook?: string;
  };
  policies?: {
    terms?: string;
    returnPolicy?: string;
    privacyPolicy?: string;
  };
  paymentMethods?: {
    cash: boolean;
    card: boolean;
    transfer: boolean;
  };
  bankAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    verified?: boolean;
  };
  onboarding?: {
    websiteGenerated?: boolean;
    firstServiceAdded?: boolean;
    firstServiceSkipped?: boolean;
    availabilityConfigured?: boolean;
    onboardingCompleted?: boolean;
    completedAt?: string;
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
  category?: string;
  categoryId?: string | null;
  categoryNameSnapshot?: string;
  price: number;
  duration: number;
  capacity?: number;
  images?: Array<{ url: string; alt?: string }>;
  location?: any;
  features?: string[];
  isActive?: boolean;
  rating?: {
    average: number;
    count: number;
  };
  createdAt?: string;
  updatedAt?: string;
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
  endDate?: string | null;
  reason?: string;
}

export interface Schedule {
  _id: string;
  provider: string;
  timezone: string;
  weeklySchedule: WeeklySchedule;
  bufferTime: number;
  bookingWindowDays?: number;
  minimumLeadTimeMinutes?: number;
  unavailableDates: UnavailableDate[];
  createdAt: string;
  updatedAt: string;
}

// Server-computed availability
export interface AvailabilitySlot {
  date: string;
  start: string;
  end: string;
  localStart: string;
  localEnd: string;
  label: string;
  timezone: string;
}

export interface AvailabilityDay {
  date: string;
  available: boolean;
  slotCount: number;
}

export interface ProviderAvailability {
  provider: { _id: string; slug: string; businessName: string; timezone: string };
  service: { _id: string; name: string; durationMinutes: number; price: number };
  timezone: string;
  timezoneLabel: string;
  horizonDays: number;
  minimumLeadTimeMinutes: number;
  date: string;
  days: AvailabilityDay[];
  slots: AvailabilitySlot[];
  alternatives: AvailabilitySlot[];
  hasAvailability: boolean;
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
  logo?: string;
  profileImage?: string;
  headerImage?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    zipCode?: string;
  };
  socialHandles?: {
    instagram?: string;
    whatsapp?: string;
    twitter?: string;
    facebook?: string;
  };
  policies?: {
    terms?: string;
    returnPolicy?: string;
    privacyPolicy?: string;
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
  categories?: any[];
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
  startAt?: string;
  endAt?: string;
  holdExpiresAt?: string | null;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  paymentStatus: 'awaiting_payment' | 'awaiting_verification' | 'confirmed' | 'cancelled';
  paymentType: 'bank_transfer' | 'full' | 'deposit' | 'pay_later';
  paymentMethod?: 'bank_transfer' | 'pay_later' | 'card';
  totalPrice?: number;
  depositAmount?: number;
  balanceDue?: number;
  amountReceived?: number;
  verifiedAt?: string | null;
  confirmationEmail?: {
    status: 'not_sent' | 'pending' | 'sent' | 'failed';
    sentAt?: string | null;
    error?: string | null;
  };
  pricing: {
    servicePrice: number;
    depositAmount: number;
    totalAmount: number;
    currency: string;
  };
  notes?: string;
  whatsappLink?: string;
  receiptImageUrl?: string;
  paymentReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBooking {
  reference: string;
  status: Booking['status'];
  paymentStatus: Booking['paymentStatus'];
  paymentMethod?: string;
  service: { name: string; duration?: number | null };
  startAt: string;
  endAt?: string | null;
  timeSlot: { startTime: string; endTime: string };
  timezone: string;
  dateLabel: string | null;
  timeLabel: string | null;
  amount: {
    total: number;
    deposit: number;
    dueNow: number;
    received: number;
    balanceDue: number;
    currency: string;
  };
  receipt: {
    uploaded: boolean;
    status: 'missing' | 'awaiting_verification' | 'verified';
  };
  provider: { name: string; phone: string | null; email: string | null };
  bankDetails: {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
  } | null;
  holdExpiresAt: string | null;
  canUploadReceipt: boolean;
  canCancel: boolean;
  portalPath: string;
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
