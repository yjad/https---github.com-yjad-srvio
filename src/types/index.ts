export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'CUSTOMER_SERVICE';
export type BookingStatus = 'REQUESTED' | 'ACCEPTED' | 'COUNTER_OFFERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAYMENT_PENDING' | 'FULLY_PAID' | 'REFUNDED' | 'FAILED' | 'DISPUTED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
export type TransactionType = 'RESERVATION' | 'FINAL_PAYMENT' | 'REFUND' | 'PENALTY';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'MEDIATION' | 'ESCALATED' | 'RESOLVED' | 'REJECTED' | 'REFUNDED' | 'CLOSED';

export interface User {
  id: number;
  name: string;
  nameAr: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  avatar: string;
  bio: string;
  bioAr?: string;
  address: string;
  joinDate: string;
  isVerified: boolean;
  preferredLanguage: string;
}

export interface ServiceFamily {
  id: number;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  nameAr?: string;
  icon: string;
  description: string;
  descriptionAr?: string;
  color: string;
  serviceCount: number;
  isActive?: boolean;
  activationDate?: string;
  familyId?: number;
}

export interface Service {
  id: number;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  categoryId: number;
  providerId: number;
  providerName: string;
  providerNameAr?: string;
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
  rejectionNote?: string;
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
  proposedDate?: string;
  proposedTime?: string;
  offerNote?: string;
  offerRound?: number;
  createdAt: string;
  platformCommission?: number;
  platformTax?: number;
}

export interface BookingMessage {
  id: number;
  bookingId: number;
  fromId: number;
  fromName: string;
  fromRole: UserRole;
  type: 'message' | 'system';
  message: string;
  createdAt: string;
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
  disputeWindowDays: number;
  mediationDurationHours: number;
  maxDisputeFiles: number;
}

export type DisputeCategory = 'SERVICE_NOT_DELIVERED' | 'POOR_QUALITY' | 'WRONG_PRICE' | 'DAMAGED_PROPERTY' | 'PROVIDER_NO_SHOW' | 'CUSTOMER_ABUSE' | 'INCOMPLETE_WORK' | 'PAYMENT_ISSUE' | 'OTHER';
export type DisputeResolutionType = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'REWORK' | 'PAYMENT_RELEASE' | 'ACCOUNT_REVIEW' | 'OTHER';
export type AdminAction = 'APPROVE_REFUND' | 'REJECT_DISPUTE' | 'PARTIAL_SETTLEMENT' | 'REQUEST_MORE_INFO' | 'RELEASE_ESCROW' | 'CLOSE_CASE' | 'ESCALATE';

export interface Dispute {
  id: number;
  bookingId: number;
  raisedById: number;
  raisedByRole: 'CUSTOMER' | 'PROVIDER';
  disputeCategory: DisputeCategory;
  title: string;
  description: string;
  requestedResolution: DisputeResolutionType;
  status: DisputeStatus;
  resolution?: {
    type: DisputeResolutionType | 'NO_REFUND' | 'REWORK_APPROVED' | 'PROVIDER_PAID' | 'SPLIT_SETTLEMENT' | 'ACCOUNT_WARNING';
    csComment: string;
    financialSummary: string;
    actorId: number;
    timestamp: string;
  };
  holdAmount: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface DisputeMessage {
  id: number;
  disputeId: number;
  fromId: number;
  fromRole: UserRole;
  message: string;
  isInternalNote: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface DisputeEvidence {
  id: number;
  disputeId: number;
  uploaderId: number;
  fileType: string;
  fileName: string;
  filePath: string;
  checksum: string;
  uploadedAt: string;
}

export interface DisputeTimelineEntry {
  id: number;
  disputeId: number;
  action: string;
  actorId: number;
  actorRole: UserRole;
  description: string;
  createdAt: string;
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

export interface ImageBlob {
  id: number;
  path: string;
  data: string;
  type: 'services' | 'avatars' | 'attachments';
  createdAt: string;
}

export interface ServiceComment {
  id: number;
  serviceId: number;
  fromId: number;
  fromName: string;
  fromRole: UserRole;
  message: string;
  attachments?: string[];
  createdAt: string;
  edited?: boolean;
  editedAt?: string;
}

export interface AuthToken {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
  exp: number;
}

export interface FilterState {
  family: number | null;
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
