export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'CUSTOMER_SERVICE';
export type BookingStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAYMENT_PENDING' | 'FULLY_PAID' | 'REFUNDED' | 'FAILED' | 'DISPUTED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
export type TransactionType = 'RESERVATION' | 'FINAL_PAYMENT' | 'REFUND' | 'PENALTY';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_PROVIDER' | 'RESOLVED_CUSTOMER' | 'CLOSED';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  avatar: string;
  bio: string;
  joinDate: string;
  isVerified: boolean;
  preferredLanguage: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  color: string;
  serviceCount: number;
  isActive?: boolean;
  activationDate?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  providerId: number;
  providerName: string;
  providerAvatar: string;
  providerRating: number;
  price: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  image: string;
  duration: string;
  createdAt: string;
  isActive?: boolean;
  verificationStatus?: 'approved' | 'pending' | 'rejected';
}

export interface Booking {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  serviceId: number;
  serviceName: string;
  providerId: number;
  providerName: string;
  date: string;
  time: string;
  address: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  createdAt: string;
  platformCommission?: number;
  platformTax?: number;
}

export interface PaymentTransaction {
  id: number;
  bookingId: number;
  stripePaymentIntentId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  createdAt: string;
}

export interface SystemSettings {
  reservationPercentage: number;
  commissionTaxPercentage: number;
  platformCommissionPercentage: number;
  payoutDelayDays: number;
  customerFreeCancellationHours: number;
  vendorFreeCancellationHours: number;
  customerLateCancellationFee: number;
  vendorLateCancellationFee: number;
}

export interface Review {
  id: number;
  bookingId: number;
  customerId: number;
  customerName: string;
  providerId: number;
  serviceId: number;
  serviceName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AuthToken {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
  exp: number;
}

export interface FilterState {
  category: number | null;
  priceMin: number | null;
  priceMax: number | null;
  search: string;
  sortBy: 'rating' | 'price_asc' | 'price_desc' | 'name';
}

export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  avgRating: number;
  monthlyBookings: { month: string; count: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  statusDistribution: { status: string; count: number }[];
}

export interface ProviderEarnings {
  totalEarnings: number;
  completedJobs: number;
  pendingEarnings: number;
  availableForPayout: number;
  monthlyEarnings: { month: string; amount: number }[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
