import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.enum(['CUSTOMER', 'PROVIDER', 'CUSTOMER_SERVICE'] as const),
});

export const bookingSchema = z.object({
  serviceId: z.number().positive(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  notes: z.string().optional(),
});

export const reviewSchema = z.object({
  bookingId: z.number().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
});

export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.number().positive(),
  price: z.coerce.number().positive(),
  priceUnit: z.string().min(1),
  duration: z.string().min(1),
  image: z.string().optional(),
});

export const serviceFamilySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  icon: z.string().min(1, 'Icon name is required'),
  color: z.string().min(4, 'Colour is required'),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().min(1, 'Icon is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  color: z.string().min(4, 'Color is required'),
  activationDate: z.string().optional(),
  isActive: z.boolean().optional(),
  familyId: z.number().positive().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string(),
  bio: z.string().optional(),
  preferredLanguage: z.string().min(2, 'Language is required'),
});

export const passwordResetSchema = z.object({
  oldPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.enum(['CUSTOMER', 'PROVIDER', 'CUSTOMER_SERVICE', 'ADMIN'] as const),
  preferredLanguage: z.string().min(2, 'Language is required'),
});

export const disputeCreateSchema = z.object({
  bookingId: z.number().positive(),
  disputeCategory: z.enum([
    'SERVICE_NOT_DELIVERED', 'POOR_QUALITY', 'WRONG_PRICE',
    'DAMAGED_PROPERTY', 'PROVIDER_NO_SHOW', 'CUSTOMER_ABUSE',
    'INCOMPLETE_WORK', 'PAYMENT_ISSUE', 'OTHER',
  ] as const),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requestedResolution: z.enum([
    'FULL_REFUND', 'PARTIAL_REFUND', 'REWORK',
    'PAYMENT_RELEASE', 'ACCOUNT_REVIEW', 'OTHER',
  ] as const),
});

export const disputeMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  isInternalNote: z.boolean().optional(),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServiceFamilyInput = z.infer<typeof serviceFamilySchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type DisputeCreateInput = z.infer<typeof disputeCreateSchema>;
export type DisputeMessageInput = z.infer<typeof disputeMessageSchema>;
