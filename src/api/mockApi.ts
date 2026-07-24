import type { User, Service, Booking, Review, Category, ServiceFamily, BookingStatus, AdminStats, AuthToken, SystemSettings, PaymentTransaction, TransactionType, ProviderEarnings, ServiceComment, ImageBlob, Dispute, DisputeMessage, DisputeEvidence, DisputeTimelineEntry, DisputeStatus, DisputeCategory, DisputeResolutionType, BookingMessage } from '@/types';

const BASE = import.meta.env.VITE_API_URL
  // ? `${import.meta.env.VITE_API_URL}/api`
  ? `${import.meta.env.VITE_API_URL}`
  : '/api';

const ID_FIELDS = new Set([
  'id', 'userId', 'customerId', 'providerId', 'serviceId',
  'bookingId', 'disputeId', 'actorId', 'uploaderId', 'raisedById',
  'categoryId', 'familyId',
]);

function normalizeIds<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(normalizeIds) as unknown as T;
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const val = (obj as Record<string, unknown>)[key];
      if (ID_FIELDS.has(key) && typeof val === 'string' && /^\d+$/.test(val)) {
        (obj as Record<string, unknown>)[key] = Number(val);
      } else {
        normalizeIds(val);
      }
    }
  }
  return obj;
}

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
  return normalizeIds(await res.json()) as T;
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

// ─── ID Generator (json-server v1 beta generates UUID strings; force numeric IDs) ──
async function nextId(collection: string): Promise<number> {
  const items = await api<any[]>(`/${collection}`);
  return items.reduce((max, item) => {
    const num = Number(item.id);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0) + 1;
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
    const id = await nextId('users');
    const newUser = await api<User>('/users', {
      method: 'POST',
      body: JSON.stringify({
        id,
        ...input,
        avatar: '',
        bio: '',
        joinDate: new Date().toISOString().split('T')[0],
        isVerified: input.role === 'PROVIDER' ? false : true,
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
    const updated = stripPassword(await api<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatable),
    }));
    if (updatable.name) {
      api<Service[]>(`/services?providerId=${userId}`).then(services => {
        for (const svc of services) {
          api(`/services/${svc.id}`, { method: 'PATCH', body: JSON.stringify({ providerName: updatable.name, ...(updatable.nameAr !== undefined && { providerNameAr: updatable.nameAr }) }) });
        }
      }).catch(() => {});
    }
    return updated;
  },

  async adminUpdateUser(userId: number, data: Partial<User>): Promise<User> {
    const { id, password, ...updatable } = data;
    const updated = stripPassword(await api<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatable),
    }));
    if (updatable.name) {
      api<Service[]>(`/services?providerId=${userId}`).then(services => {
        for (const svc of services) {
          api(`/services/${svc.id}`, { method: 'PATCH', body: JSON.stringify({ providerName: updatable.name, ...(updatable.nameAr !== undefined && { providerNameAr: updatable.nameAr }) }) });
        }
      }).catch(() => {});
    }
    return updated;
  },

  async adminCreateUser(input: { name: string; email: string; password: string; phone: string; role: 'CUSTOMER' | 'PROVIDER' | 'CUSTOMER_SERVICE' | 'ADMIN'; preferredLanguage: string }): Promise<User> {
    const existing = await api<User[]>(`/users?email=${encodeURIComponent(input.email)}`);
    if (existing.length > 0) throw new Error('Email already registered');
    const id = await nextId('users');
    const newUser = await api<User>('/users', {
      method: 'POST',
      body: JSON.stringify({
        id,
        ...input,
        avatar: '',
        bio: '',
        joinDate: new Date().toISOString().split('T')[0],
        isVerified: true,
      }),
    });
    return stripPassword(newUser);
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
    const id = await nextId('categories');
    return api<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({
        id,
        name: data.name || 'Untitled',
        icon: data.icon || '',
        description: data.description || '',
        color: data.color || '#000000',
        serviceCount: 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        activationDate: data.activationDate || new Date().toISOString().split('T')[0],
        familyId: data.familyId,
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

  // ── Service Families ──
  async getServiceFamilies(): Promise<ServiceFamily[]> {
    const families = await api<ServiceFamily[]>('/serviceFamilies');
    return families.filter(f => f.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getAllServiceFamilies(): Promise<ServiceFamily[]> {
    return api<ServiceFamily[]>('/serviceFamilies');
  },

  async getServiceFamilyById(id: number): Promise<ServiceFamily | null> {
    try { return await api<ServiceFamily>(`/serviceFamilies/${id}`); } catch { return null; }
  },

  async createServiceFamily(data: Partial<ServiceFamily>): Promise<ServiceFamily> {
    const id = await nextId('serviceFamilies');
    return api<ServiceFamily>('/serviceFamilies', {
      method: 'POST',
      body: JSON.stringify({
        id,
        name: data.name || 'Untitled',
        description: data.description || '',
        icon: data.icon || 'Folder',
        color: data.color || '#6b7280',
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder ?? 0,
        createdAt: new Date().toISOString().split('T')[0],
      }),
    });
  },

  async updateServiceFamily(id: number, data: Partial<ServiceFamily>): Promise<ServiceFamily> {
    return api<ServiceFamily>(`/serviceFamilies/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async deleteServiceFamily(id: number): Promise<void> {
    await fetch(`${BASE}/serviceFamilies/${id}`, { method: 'DELETE' });
    const categories = await api<Category[]>(`/categories?familyId=${id}`);
    for (const c of categories) {
      await api(`/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ familyId: undefined }) }).catch(() => { });
    }
  },

  async getCategoriesByFamily(familyId: number): Promise<Category[]> {
    const all = await api<Category[]>('/categories');
    return all.filter(c => String(c.familyId) === String(familyId));
  },

  // ── Services ──
  async getServices(params?: { category?: number | null; familyId?: number | null; search?: string; priceMin?: number | null; priceMax?: number | null; sortBy?: string; providerId?: number | null }): Promise<Service[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('q', params.search);
    if (params?.priceMin != null) q.set('price_gte', String(params.priceMin));
    if (params?.priceMax != null) q.set('price_lte', String(params.priceMax));
    if (params?.providerId != null) q.set('providerId', String(params.providerId));
    if (params?.sortBy === 'rating') { q.set('_sort', '-rating'); }
    else if (params?.sortBy === 'price_asc') { q.set('_sort', 'price'); }
    else if (params?.sortBy === 'price_desc') { q.set('_sort', '-price'); }
    else if (params?.sortBy === 'name') { q.set('_sort', 'name'); }

    let services = await api<Service[]>(`/services?${q.toString()}`);

    // Client-side category/family filtering
    if (params?.category) {
      services = services.filter(s => String(s.categoryId) === String(params.category));
    } else if (params?.familyId) {
      const allCategories = await api<Category[]>('/categories');
      const ids = allCategories.filter(c => String(c.familyId) === String(params.familyId)).map(c => String(c.id));
      services = services.filter(s => ids.includes(String(s.categoryId)));
    }

    if (params?.providerId) {
      return services.filter(s => s.isActive !== false);
    }
    return services.filter(s => s.isActive !== false && s.verificationStatus === 'approved');
  },

  async getServiceById(id: number): Promise<Service | null> {
    try { return await api<Service>(`/services/${id}`); } catch { return null; }
  },

  async createService(data: Omit<Service, 'id' | 'rating' | 'reviewCount' | 'createdAt'>): Promise<Service> {
    const id = await nextId('services');
    return api<Service>('/services', {
      method: 'POST',
      body: JSON.stringify({ id, ...data, rating: 0, reviewCount: 0, verificationStatus: 'pending', isActive: false, createdAt: new Date().toISOString().split('T')[0] }),
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
    const id = await nextId('bookings');
    return api<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        id,
        ...data,
        customerId: Number(data.customerId),
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

  async counterOfferBooking(id: number, data: { proposedDate: string; proposedTime: string; offerNote?: string }): Promise<Booking> {
    const booking = await api<Booking>(`/bookings/${id}`);
    if (booking.status !== 'REQUESTED' && booking.status !== 'COUNTER_OFFERED') {
      throw new Error('Booking cannot be counter-offered in its current status');
    }
    const round = (booking.offerRound || 0) + 1;
    const updated = await api<Booking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'COUNTER_OFFERED',
        proposedDate: data.proposedDate,
        proposedTime: data.proposedTime,
        offerNote: data.offerNote || '',
        offerRound: round,
      }),
    });
    await mockApi.sendBookingMessage(id, {
      fromId: 0,
      fromName: 'System',
      fromRole: 'ADMIN',
      type: 'system',
      message: `Counter-offer sent (round ${round}/3): ${data.proposedDate} at ${data.proposedTime}${data.offerNote ? ` — ${data.offerNote}` : ''}`,
    });
    if (round >= 3) {
      await api<Booking>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) });
      await mockApi.sendBookingMessage(id, {
        fromId: 0,
        fromName: 'System',
        fromRole: 'ADMIN',
        type: 'system',
        message: 'Maximum negotiation rounds reached. Booking has been automatically cancelled.',
      });
    }
    return updated;
  },

  async acceptBooking(id: number): Promise<Booking> {
    const booking = await api<Booking>(`/bookings/${id}`);
    if (booking.status !== 'REQUESTED' && booking.status !== 'COUNTER_OFFERED') {
      throw new Error('Booking cannot be accepted in its current status');
    }
    const patch: Partial<Booking> = { status: 'ACCEPTED' };
    if (booking.status === 'COUNTER_OFFERED' && booking.proposedDate && booking.proposedTime) {
      patch.date = booking.proposedDate;
      patch.time = booking.proposedTime;
    }
    const updated = await api<Booking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await mockApi.sendBookingMessage(id, {
      fromId: 0,
      fromName: 'System',
      fromRole: 'ADMIN',
      type: 'system',
      message: `Booking accepted! Scheduled for ${updated.date} at ${updated.time}.`,
    });
    return updated;
  },

  async cancelBooking(id: number, reason?: string): Promise<Booking> {
    const updated = await api<Booking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    await mockApi.sendBookingMessage(id, {
      fromId: 0,
      fromName: 'System',
      fromRole: 'ADMIN',
      type: 'system',
      message: `Booking cancelled${reason ? `: ${reason}` : ''}.`,
    });
    return updated;
  },

  async getBookingMessages(bookingId: number): Promise<BookingMessage[]> {
    const all = await api<BookingMessage[]>('/bookingMessages');
    return all
      .filter(m => m.bookingId === bookingId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async sendBookingMessage(bookingId: number, data: { fromId: number; fromName: string; fromRole: import('@/types').UserRole; message: string; type?: 'message' | 'system' }): Promise<BookingMessage> {
    const id = await nextId('bookingMessages');
    const msg: BookingMessage = {
      id,
      bookingId,
      fromId: data.fromId,
      fromName: data.fromName,
      fromRole: data.fromRole,
      type: data.type || 'message',
      message: data.message,
      createdAt: new Date().toISOString(),
    };
    return api<BookingMessage>('/bookingMessages', {
      method: 'POST',
      body: JSON.stringify(msg),
    });
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
    const txId = await nextId('transactions');
    await api<PaymentTransaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        id: txId,
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

  // ── Service Approval Cycle ──
  async getPendingServices(): Promise<Service[]> {
    const all = await api<Service[]>('/services');
    return all.filter(s => s.verificationStatus === 'pending');
  },

  async getServiceComments(serviceId: number): Promise<ServiceComment[]> {
    const all = await api<ServiceComment[]>('/serviceComments');
    return all.filter(c => c.serviceId === serviceId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async getAllServiceComments(): Promise<ServiceComment[]> {
    return api<ServiceComment[]>('/serviceComments');
  },

  async addServiceComment(data: { serviceId: number; fromId: number; fromName: string; fromRole: UserRole; message: string; attachments?: string[] }): Promise<ServiceComment> {
    const id = await nextId('serviceComments');
    return api<ServiceComment>('/serviceComments', {
      method: 'POST',
      body: JSON.stringify({ id, ...data, createdAt: new Date().toISOString() }),
    });
  },

  async updateServiceComment(id: number, data: { message: string; attachments?: string[] }): Promise<ServiceComment> {
    return api<ServiceComment>(`/serviceComments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, edited: true, editedAt: new Date().toISOString() }),
    });
  },

  async deleteServiceComment(id: number): Promise<void> {
    await fetch(`${BASE}/serviceComments/${id}`, { method: 'DELETE' });
  },

  sendRejectionEmail(providerEmail: string, serviceName: string, note: string): void {
    console.log('%c📧 REJECTION EMAIL', 'background:#dc2626;color:white;padding:4px 8px;font-weight:bold;border-radius:4px 4px 0 0;');
    console.log(`  To:      ${providerEmail}`);
    console.log(`  Subject: Service "${serviceName}" has been rejected`);
    console.log(`  Body:    Your service "${serviceName}" was not approved.\n`);
    console.log(`           Reason: ${note}\n`);
    console.log(`           Please review the feedback and resubmit.`);
    console.log('%c──────────────────────────────────────', 'color:#dc2626');
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
    const id = await nextId('reviews');
    const newReview = await api<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        id,
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

  async getUserById(id: number): Promise<User | null> {
    try {
      return stripPassword(await api<User>(`/users/${id}`));
    } catch {
      return null;
    }
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

  // ── Disputes ──
  async getDisputes(filters?: { userId?: number; role?: string }): Promise<Dispute[]> {
    const all = await api<Dispute[]>('/disputes');
    if (!filters) return all;
    if (filters.role === 'CUSTOMER_SERVICE' || filters.role === 'ADMIN') return all;
    if (filters.role === 'PROVIDER' && filters.userId) {
      const bookings = await api<Booking[]>('/bookings');
      const providerBookingIds = bookings.filter(b => b.providerId === filters.userId).map(b => b.id);
      return all.filter(d => d.raisedById === filters.userId || providerBookingIds.includes(d.bookingId));
    }
    return all.filter(d => d.raisedById === filters.userId);
  },

  async getDisputeById(id: number): Promise<Dispute | null> {
    try {
      return await api<Dispute>(`/disputes/${id}`);
    } catch {
      return null;
    }
  },

  async createDispute(data: { bookingId: number; raisedById: number; raisedByRole: 'CUSTOMER' | 'PROVIDER'; disputeCategory: DisputeCategory; title: string; description: string; requestedResolution: DisputeResolutionType }): Promise<Dispute> {
    const [bookings, settings] = await Promise.all([
      api<Booking[]>('/bookings'),
      api<SystemSettings>('/systemSettings'),
    ]);
    const booking = bookings.find(b => b.id === data.bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'COMPLETED') throw new Error('Booking must be completed to raise a dispute');
    const existing = await api<Dispute[]>('/disputes');
    if (existing.some(d => d.bookingId === data.bookingId && d.status !== 'CLOSED')) {
      throw new Error('A dispute already exists for this booking');
    }
    const daysSinceCompletion = (Date.now() - new Date(booking.createdAt).getTime()) / 86400000;
    if (daysSinceCompletion > settings.disputeWindowDays) throw new Error('Dispute window has expired');

    const id = await nextId('disputes');
    const now = new Date().toISOString();
    const dispute = await api<Dispute>('/disputes', {
      method: 'POST',
      body: JSON.stringify({ id, ...data, status: 'OPEN', holdAmount: booking.totalPrice - (booking.paidAmount || 0), createdAt: now, updatedAt: now }),
    });
    await api<Booking>(`/bookings/${data.bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus: 'DISPUTED' }),
    });
    await this.addTimelineEntry({ disputeId: id, action: 'CREATED', actorId: data.raisedById, actorRole: data.raisedByRole, description: 'Dispute opened' });
    return dispute;
  },

  async updateDisputeStatus(id: number, status: DisputeStatus): Promise<Dispute> {
    const dispute = await this.getDisputeById(id);
    if (!dispute) throw new Error('Dispute not found');
    const transitionMap: Record<string, DisputeStatus[]> = {
      OPEN: ['CLOSED', 'UNDER_REVIEW'],
      UNDER_REVIEW: ['MEDIATION', 'REJECTED', 'CLOSED'],
      MEDIATION: ['ESCALATED', 'RESOLVED'],
      ESCALATED: ['RESOLVED'],
      RESOLVED: ['CLOSED', 'REFUNDED'],
      REJECTED: ['CLOSED'],
      REFUNDED: ['CLOSED'],
    };
    const allowed = transitionMap[dispute.status] || [];
    if (!allowed.includes(status)) throw new Error(`Cannot transition from ${dispute.status} to ${status}`);
    const updated = await api<Dispute>(`/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, updatedAt: new Date().toISOString(), ...(status === 'CLOSED' ? { closedAt: new Date().toISOString() } : {}) }),
    });
    return updated;
  },

  async resolveDispute(id: number, resolution: { type: string; csComment: string; actorId: number; financialSummary: string }): Promise<Dispute> {
    const dispute = await this.getDisputeById(id);
    if (!dispute) throw new Error('Dispute not found');
    if (dispute.status !== 'UNDER_REVIEW' && dispute.status !== 'MEDIATION' && dispute.status !== 'ESCALATED') {
      throw new Error('Dispute must be under review, mediation, or escalated to resolve');
    }
    const now = new Date().toISOString();
    const updated = await api<Dispute>(`/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'RESOLVED',
        resolution: { ...resolution, timestamp: now },
        updatedAt: now,
      }),
    });
    await this.addTimelineEntry({ disputeId: id, action: 'RESOLVED', actorId: resolution.actorId, actorRole: 'ADMIN', description: `Resolved: ${resolution.type}` });
    return updated;
  },

  async getDisputeMessages(disputeId: number): Promise<DisputeMessage[]> {
    const all = await api<DisputeMessage[]>('/disputeMessages');
    return all.filter(m => m.disputeId === disputeId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async addDisputeMessage(disputeId: number, data: { fromId: number; fromRole: UserRole; message: string; isInternalNote?: boolean }): Promise<DisputeMessage> {
    const dispute = await this.getDisputeById(disputeId);
    if (!dispute) throw new Error('Dispute not found');
    if (data.isInternalNote && data.fromRole !== 'CUSTOMER_SERVICE' && data.fromRole !== 'ADMIN') {
      throw new Error('Only CS staff can add internal notes');
    }
    const id = await nextId('disputeMessages');
    const msg = await api<DisputeMessage>('/disputeMessages', {
      method: 'POST',
      body: JSON.stringify({ id, disputeId, ...data, isInternalNote: data.isInternalNote || false, createdAt: new Date().toISOString() }),
    });
    return msg;
  },

  async getDisputeEvidence(disputeId: number): Promise<DisputeEvidence[]> {
    const all = await api<DisputeEvidence[]>('/disputeEvidence');
    return all.filter(e => e.disputeId === disputeId);
  },

  async deleteDisputeEvidence(id: number, filePath: string): Promise<void> {
    await Promise.all([
      this.deleteImage(filePath),
      fetch(`${BASE}/disputeEvidence/${id}`, { method: 'DELETE' }),
    ]);
  },

  async uploadEvidence(disputeId: number, data: { uploaderId: number; fileType: string; fileName: string; filePath: string }): Promise<DisputeEvidence> {
    const dispute = await this.getDisputeById(disputeId);
    if (!dispute) throw new Error('Dispute not found');
    if (!['OPEN', 'UNDER_REVIEW', 'MEDIATION', 'ESCALATED'].includes(dispute.status)) {
      throw new Error('Cannot upload evidence to a closed or resolved dispute');
    }
    const id = await nextId('disputeEvidence');
    const checksum = btoa(`${data.fileName}:${data.uploaderId}:${Date.now()}`);
    return api<DisputeEvidence>('/disputeEvidence', {
      method: 'POST',
      body: JSON.stringify({ id, disputeId, ...data, checksum, uploadedAt: new Date().toISOString() }),
    });
  },

  async getDisputeTimeline(disputeId: number): Promise<DisputeTimelineEntry[]> {
    const all = await api<DisputeTimelineEntry[]>('/disputeTimeline');
    return all.filter(t => t.disputeId === disputeId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async addTimelineEntry(data: { disputeId: number; action: string; actorId: number; actorRole: UserRole; description: string }): Promise<DisputeTimelineEntry> {
    const id = await nextId('disputeTimeline');
    return api<DisputeTimelineEntry>('/disputeTimeline', {
      method: 'POST',
      body: JSON.stringify({ id, ...data, createdAt: new Date().toISOString() }),
    });
  },

  async getAllDisputes(): Promise<Dispute[]> {
    return api<Dispute[]>('/disputes');
  },

  async getCSDisputeStats(): Promise<{ open: number; underReview: number; escalated: number; resolved: number }> {
    const all = await api<Dispute[]>('/disputes');
    return {
      open: all.filter(d => d.status === 'OPEN').length,
      underReview: all.filter(d => d.status === 'UNDER_REVIEW').length,
      escalated: all.filter(d => d.status === 'ESCALATED').length,
      resolved: all.filter(d => d.status === 'RESOLVED' || d.status === 'REFUNDED').length,
    };
  },

  async checkMediationTimeouts(): Promise<void> {
    const disputes = await api<Dispute[]>('/disputes');
    const settings = await api<SystemSettings>('/systemSettings');
    const now = Date.now();
    for (const d of disputes) {
      if (d.status === 'MEDIATION') {
        const elapsed = (now - new Date(d.createdAt).getTime()) / 3600000;
        if (elapsed >= settings.mediationDurationHours) {
          await api<Dispute>(`/disputes/${d.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ESCALATED', updatedAt: new Date().toISOString() }),
          });
        }
      }
    }
  },

  // ── Image Upload ──
  async saveImage(data: string, subfolder: string = 'attachments'): Promise<string> {
    const ext = data.startsWith('data:image/png') ? 'png' : data.startsWith('data:image/gif') ? 'gif' : 'jpg';
    const res = await api<{ url: string }>('/upload', {
      method: 'POST',
      body: JSON.stringify({ data, subfolder, name: `file.${ext}` }),
    });
    return res.url;
  },

  async getImageBlob(path: string): Promise<string | null> {
    if (path.startsWith('/uploads/')) return path;
    // Legacy blob store fallback
    try {
      const blobs = await api<ImageBlob[]>('/imageBlobs');
      return blobs.find(b => b.path === path)?.data || null;
    } catch {
      return null;
    }
  },

  async deleteImage(path: string): Promise<void> {
    if (path.startsWith('/uploads/')) {
      await fetch(`${BASE}/upload`, {
        method: 'DELETE',
        body: JSON.stringify({ url: path }),
      });
      return;
    }
    // Legacy blob store fallback
    try {
      const blobs = await api<ImageBlob[]>('/imageBlobs');
      const blob = blobs.find(b => b.path === path);
      if (blob) {
        await fetch(`${BASE}/imageBlobs/${blob.id}`, { method: 'DELETE' });
      }
    } catch {
      /* ignore */
    }
  },

  async getAllImageBlobs(): Promise<ImageBlob[]> {
    return api<ImageBlob[]>('/imageBlobs');
  },

  async uploadAvatar(userId: number, base64: string): Promise<{ url: string }> {
    const url = await mockApi.saveImage(base64, 'avatars');
    await mockApi.updateUser(userId, { avatar: url });
    return { url };
  },

  // ── Reset ──
  async resetDatabase(): Promise<void> {
    const collections = ['categories', 'users', 'services', 'bookings', 'reviews', 'transactions', 'payouts', 'disputes', 'disputeMessages', 'disputeEvidence', 'disputeTimeline', 'serviceComments', 'serviceFamilies', 'imageBlobs', 'bookingMessages'];
    for (const col of collections) {
      const items = await api<any[]>(`/${col}`);
      for (const item of items) {
        await fetch(`${BASE}/${col}/${item.id}`, { method: 'DELETE' }).catch(() => { });
      }
    }
    // Clear uploaded files
    await fetch(`${BASE}/upload`, { method: 'DELETE', body: JSON.stringify({ url: '__all__' }) }).catch(() => { });
  },
};
