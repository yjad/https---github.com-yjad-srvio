import type { User, Service, Booking, Review, Category, BookingStatus, AdminStats, AuthToken, SystemSettings, PaymentTransaction, TransactionType, ProviderEarnings } from '@/types';

const BASE = '/api';

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const isBody = options?.method && options.method !== 'GET';
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      ...(isBody ? { 'Content-Type': 'application/json' } : {}),
      ...((options?.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok && res.status !== 404) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Auth Utilities ───────────────────────────────────────
function createToken(user: User): string {
  const token: AuthToken = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  return `ss_${btoa(JSON.stringify(token))}`;
}

function decodeToken(token: string): AuthToken | null {
  try {
    const decoded = JSON.parse(atob(token.replace('ss_', '')));
    if (decoded.exp < Date.now()) return null;
    return decoded as AuthToken;
  } catch {
    return null;
  }
}

function stripPassword(u: User): User {
  const { password: _, ...safe } = u;
  return safe as User;
}

// ─── Email Verification (simulated) ────────────────────────
const verificationPins: Record<string, { pin: string; expiresAt: number }> = {};

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── API Layer ────────────────────────────────────────────
export const mockApi = {
  // ── Auth ──
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const users = await api<User[]>(`/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    const user = users[0];
    if (!user) throw new Error('Invalid email or password');
    return { token: createToken(user), user: stripPassword(user) };
  },

  async register(input: { name: string; email: string; password: string; phone: string; role: 'CUSTOMER' | 'PROVIDER' | 'CUSTOMER_SERVICE' }): Promise<{ token: string; user: User }> {
    const existing = await api<User[]>(`/users?email=${encodeURIComponent(input.email)}`);
    if (existing.length > 0) throw new Error('Email already registered');
    const newUser = await api<User>('/users', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        avatar: '',
        bio: '',
        joinDate: new Date().toISOString().split('T')[0],
        isVerified: false,
        preferredLanguage: 'en',
      }),
    });
    return { token: createToken(newUser), user: stripPassword(newUser) };
  },

  // ── Email Verification (simulated) ──
  async sendVerificationPin(email: string): Promise<void> {
    const pin = generatePin();
    verificationPins[email] = { pin, expiresAt: Date.now() + 10 * 60 * 1000 };
    // Simulated email output
    console.log('%c📧 EMAIL VERIFICATION', 'background:#4f46e5;color:white;padding:4px 8px;font-weight:bold;border-radius:4px 4px 0 0;');
    console.log(`  To:      ${email}`);
    console.log(`  Subject: Your srvio verification PIN`);
    console.log(`  Body:    Your verification PIN is: ${pin}`);
    console.log('%c──────────────────────────────────────', 'color:#4f46e5');
  },

  async verifyEmailPin(email: string, pin: string): Promise<boolean> {
    const stored = verificationPins[email];
    if (!stored) throw new Error('No verification PIN found. Please request a new one.');
    if (Date.now() > stored.expiresAt) {
      delete verificationPins[email];
      throw new Error('PIN has expired. Please request a new one.');
    }
    if (stored.pin !== pin) throw new Error('Invalid PIN. Please try again.');
    delete verificationPins[email];
    return true;
  },

  async getMe(token: string): Promise<User | null> {
    const auth = decodeToken(token);
    if (!auth) return null;
    try {
      return stripPassword(await api<User>(`/users/${auth.userId}`));
    } catch {
      return null;
    }
  },

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    const { id, email, role, password, ...updatable } = data;
    return stripPassword(await api<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatable),
    }));
  },

  async adminUpdateUser(userId: number, data: Partial<User>): Promise<User> {
    const { id, password, ...updatable } = data;
    return stripPassword(await api<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatable),
    }));
  },

  async updatePassword(userId: number, oldPass: string, newPass: string): Promise<void> {
    const user = await api<User>(`/users/${userId}`);
    if (user.password !== oldPass) throw new Error('Current password incorrect');
    await api(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPass }),
    });
  },

  // ── Categories ──
  async getCategories(): Promise<Category[]> {
    const categories = await api<Category[]>('/categories');
    return categories.filter(c => c.isActive !== false && new Date(c.activationDate as string) <= new Date());
  },

  async getAllCategories(): Promise<Category[]> {
    return api<Category[]>('/categories');
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    return api<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name || 'Untitled',
        icon: data.icon || '',
        description: data.description || '',
        color: data.color || '#000000',
        serviceCount: 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        activationDate: data.activationDate || new Date().toISOString().split('T')[0],
      }),
    });
  },

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const updated = await api<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (data.isActive === false) {
      const services = await api<Service[]>(`/services?categoryId=${id}`);
      for (const s of services) {
        await api(`/services/${s.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: true }) }).catch(() => { });
      }
    }
    return updated;
  },

  // ── Services ──
  async getServices(params?: { category?: number | null; search?: string; priceMin?: number | null; priceMax?: number | null; sortBy?: string; providerId?: number | null }): Promise<Service[]> {
    const q = new URLSearchParams();
    if (params?.category) q.set('categoryId', String(params.category));
    if (params?.search) q.set('q', params.search);
    if (params?.priceMin != null) q.set('price_gte', String(params.priceMin));
    if (params?.priceMax != null) q.set('price_lte', String(params.priceMax));
    if (params?.providerId != null) q.set('providerId', String(params.providerId));
    if (params?.sortBy === 'rating') { q.set('_sort', '-rating'); }
    else if (params?.sortBy === 'price_asc') { q.set('_sort', 'price'); }
    else if (params?.sortBy === 'price_desc') { q.set('_sort', '-price'); }
    else if (params?.sortBy === 'name') { q.set('_sort', 'name'); }

    const services = await api<Service[]>(`/services?${q.toString()}`);
    return services.filter(s => s.isActive !== false);
  },

  async getServiceById(id: number): Promise<Service | null> {
    try { return await api<Service>(`/services/${id}`); } catch { return null; }
  },

  async createService(data: Omit<Service, 'id' | 'rating' | 'reviewCount' | 'createdAt'>): Promise<Service> {
    return api<Service>('/services', {
      method: 'POST',
      body: JSON.stringify({ ...data, rating: 0, reviewCount: 0, createdAt: new Date().toISOString().split('T')[0] }),
    });
  },

  async updateService(id: number, data: Partial<Service>): Promise<Service> {
    return api<Service>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async deleteService(id: number): Promise<void> {
    await fetch(`${BASE}/services/${id}`, { method: 'DELETE' });
  },

  // ── Bookings ──
  async getBookings(filters?: { userId?: number; role?: string; providerId?: number }): Promise<Booking[]> {
    const q = new URLSearchParams();
    if (filters?.role === 'CUSTOMER' && filters?.userId) q.set('customerId', String(filters.userId));
    else if (filters?.role === 'PROVIDER' && filters?.providerId) q.set('providerId', String(filters.providerId));
    q.set('_sort', '-createdAt');
    return api<Booking[]>(`/bookings?${q.toString()}`);
  },

  async getBookingById(id: number): Promise<Booking | null> {
    try { return await api<Booking>(`/bookings/${id}`); } catch { return null; }
  },

  async createBooking(data: { serviceId: number; customerId: number; date: string; time: string; address: string; notes: string }): Promise<Booking> {
    const [service, customer, settings] = await Promise.all([
      api<Service>(`/services/${data.serviceId}`),
      api<User>(`/users/${data.customerId}`),
      api<SystemSettings>('/systemSettings'),
    ]);
    const platformCommission = Math.round(service.price * (settings.platformCommissionPercentage / 100));
    const platformTax = Math.round(platformCommission * (settings.commissionTaxPercentage / 100));
    return api<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        customerId: data.customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        serviceName: service.name,
        providerId: service.providerId,
        providerName: service.providerName,
        status: 'REQUESTED',
        paymentStatus: 'UNPAID',
        subtotal: service.price,
        taxAmount: 0,
        totalPrice: service.price,
        paidAmount: 0,
        remainingAmount: service.price,
        platformCommission,
        platformTax,
        createdAt: new Date().toISOString().split('T')[0],
      }),
    });
  },

  async updateBookingStatus(id: number, status: BookingStatus): Promise<Booking> {
    return api<Booking>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  // ── Payments & Transactions ──
  async getSystemSettings(): Promise<SystemSettings> {
    return api<SystemSettings>('/systemSettings');
  },

  async updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return api<SystemSettings>('/systemSettings', { method: 'PATCH', body: JSON.stringify(data) });
  },

  async createPaymentIntent(bookingId: number, type: TransactionType): Promise<{ clientSecret: string; amount: number }> {
    const [booking, settings] = await Promise.all([
      api<Booking>(`/bookings/${bookingId}`),
      api<SystemSettings>('/systemSettings'),
    ]);
    let amount = 0;
    if (type === 'RESERVATION') amount = Math.round(booking.totalPrice * (settings.reservationPercentage / 100));
    else if (type === 'FINAL_PAYMENT') amount = booking.remainingAmount;
    return { clientSecret: `pi_${Math.random().toString(36).substring(7)}`, amount: amount * 100 };
  },

  async confirmPayment(bookingId: number, type: TransactionType, amountInCents: number): Promise<Booking> {
    const booking = await api<Booking>(`/bookings/${bookingId}`);
    const amountInDollars = amountInCents / 100;
    booking.paidAmount += amountInDollars;
    booking.remainingAmount -= amountInDollars;
    if (type === 'RESERVATION') { booking.paymentStatus = 'PARTIALLY_PAID'; booking.status = 'ACCEPTED' as BookingStatus; }
    else if (type === 'FINAL_PAYMENT') { booking.paymentStatus = 'FULLY_PAID'; }
    await api<PaymentTransaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        bookingId,
        stripePaymentIntentId: `pi_${Math.random().toString(36).substring(7)}`,
        type, amount: amountInCents, currency: 'CAD', status: 'succeeded',
        createdAt: new Date().toISOString(),
      }),
    });
    return api<Booking>(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        paidAmount: booking.paidAmount,
        remainingAmount: booking.remainingAmount,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
      }),
    });
  },

  async getTransactions(bookingId?: number): Promise<PaymentTransaction[]> {
    return api<PaymentTransaction[]>(`/transactions${bookingId ? `?bookingId=${bookingId}` : ''}`);
  },

  // ── Reviews ──
  async getReviews(providerId?: number, serviceId?: number): Promise<Review[]> {
    const q = new URLSearchParams();
    if (providerId) q.set('providerId', String(providerId));
    if (serviceId) q.set('serviceId', String(serviceId));
    return api<Review[]>(`/reviews?${q.toString()}`);
  },

  async createReview(data: { bookingId: number; rating: number; comment: string }): Promise<Review> {
    const booking = await api<Booking>(`/bookings/${data.bookingId}`);
    const newReview = await api<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        customerId: booking.customerId,
        customerName: booking.customerName,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        createdAt: new Date().toISOString().split('T')[0],
      }),
    });
    const reviews = await api<Review[]>(`/reviews?serviceId=${booking.serviceId}`);
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await api(`/services/${booking.serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ rating: Math.round(avg * 10) / 10, reviewCount: reviews.length }),
    });
    return newReview;
  },

  async deleteReview(id: number): Promise<void> {
    await fetch(`${BASE}/reviews/${id}`, { method: 'DELETE' });
  },

  // ── Admin ──
  async getAdminStats(): Promise<AdminStats> {
    const [users, services, bookings, reviews, categories] = await Promise.all([
      api<User[]>('/users'), api<Service[]>('/services'),
      api<Booking[]>('/bookings'), api<Review[]>('/reviews'), api<Category[]>('/categories'),
    ]);
    const providers = users.filter(u => u.role === 'PROVIDER');
    const regularUsers = users.filter(u => u.role === 'CUSTOMER');
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const totalRevenue = completedBookings.reduce((s, b) => s + (b.platformCommission || 0) + (b.platformTax || 0), 0);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cy = new Date().getFullYear();
    const monthlyBookings = monthNames.slice(0, 6).map((m, i) => ({ month: m, count: bookings.filter(b => { const d = new Date(b.createdAt); return d.getMonth() === i && d.getFullYear() === cy; }).length }));
    const revenueByCategory = categories.map(c => ({ category: c.name, revenue: bookings.filter(b => { const s = services.find(x => x.id === b.serviceId); return s?.categoryId === c.id && b.status === 'COMPLETED'; }).reduce((s, b) => s + b.totalPrice, 0) })).filter(c => c.revenue > 0);
    const statusDistribution = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(st => ({ status: st, count: bookings.filter(b => b.status === st).length }));
    const allRatings = reviews.map(r => r.rating);
    const avgRating = allRatings.length > 0 ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10 : 0;
    return { totalUsers: regularUsers.length, totalProviders: providers.length, totalServices: services.length, totalBookings: bookings.length, totalRevenue, pendingBookings: bookings.filter(b => b.status === 'REQUESTED').length, activeBookings: bookings.filter(b => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length, completedBookings: completedBookings.length, cancelledBookings: bookings.filter(b => b.status === 'CANCELLED').length, avgRating, monthlyBookings, revenueByCategory, statusDistribution };
  },

  async getAllUsers(): Promise<User[]> {
    const users = await api<User[]>('/users');
    return users.map(stripPassword);
  },

  async getAllServices(): Promise<Service[]> { return api<Service[]>('/services'); },
  async getAllBookings(): Promise<Booking[]> { return api<Booking[]>('/bookings'); },
  async getAllReviews(): Promise<Review[]> { return api<Review[]>('/reviews'); },

  // ── Provider Earnings ──
  async getProviderEarnings(providerId: number): Promise<ProviderEarnings> {
    const [bookings, transactions] = await Promise.all([
      api<Booking[]>(`/bookings?providerId=${providerId}`),
      api<PaymentTransaction[]>('/transactions'),
    ]);

    let totalEarnings = 0;
    let pendingEarnings = 0;
    let availableForPayout = 0;

    bookings.forEach(b => {
      if (b.status === 'CANCELLED') return;
      const providerTotal = b.totalPrice - (b.platformCommission || 0) - (b.platformTax || 0);
      const earnedSoFar = Math.max(0, b.paidAmount - (b.platformCommission || 0) - (b.platformTax || 0));

      totalEarnings += earnedSoFar;
      if (b.paymentStatus !== 'FULLY_PAID') {
        pendingEarnings += (providerTotal - earnedSoFar);
      }
      if (b.status === 'COMPLETED' && b.paymentStatus === 'FULLY_PAID') {
        availableForPayout += providerTotal;
      }
    });

    const completedJobs = bookings.filter(b => b.status === 'COMPLETED').length;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cy = new Date().getFullYear();
    const monthlyEarnings = monthNames.slice(0, 6).map((m, i) => {
      const monthBookings = bookings.filter(b => {
        const d = new Date(b.createdAt);
        return d.getMonth() === i && d.getFullYear() === cy && b.status !== 'CANCELLED';
      });
      const amount = monthBookings.reduce((s, b) => {
        return s + Math.max(0, b.paidAmount - (b.platformCommission || 0) - (b.platformTax || 0));
      }, 0);
      return { month: m, amount };
    });

    return { totalEarnings, completedJobs, pendingEarnings, availableForPayout, monthlyEarnings };
  },

  // ── Customer Stats ──
  async getCustomerStats(customerId: number): Promise<{ totalSpent: number; totalBookings: number; pendingBookings: number; completedBookings: number; monthlySpending: { month: string; amount: number }[] }> {
    const bookings = await api<Booking[]>(`/bookings?customerId=${customerId}`);
    const completed = bookings.filter(b => b.status === 'COMPLETED');
    const pending = bookings.filter(b => b.status === 'REQUESTED');
    const totalSpent = completed.reduce((s, b) => s + b.totalPrice, 0);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const cy = new Date().getFullYear();
    const monthlySpending = monthNames.map((m, i) => ({ month: m, amount: bookings.filter(b => { const d = new Date(b.createdAt); return d.getMonth() === i && d.getFullYear() === cy; }).reduce((s, b) => s + b.totalPrice, 0) }));
    return { totalSpent, totalBookings: bookings.length, pendingBookings: pending.length, completedBookings: completed.length, monthlySpending };
  },

  // ── Reset ──
  async resetDatabase(): Promise<void> {
    const collections = ['categories', 'users', 'services', 'bookings', 'reviews', 'transactions', 'payouts', 'disputes'];
    for (const col of collections) {
      const items = await api<any[]>(`/${col}`);
      for (const item of items) {
        await fetch(`${BASE}/${col}/${item.id}`, { method: 'DELETE' }).catch(() => { });
      }
    }
  },
};
