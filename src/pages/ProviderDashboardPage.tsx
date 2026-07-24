import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card, Badge, Button, Avatar, StarRating, PageHeader, ServiceImage, ImageUpload } from '@/components/shared';
import { serviceSchema, type ServiceInput } from '@/schemas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, DollarSign, Briefcase, CheckCircle, Clock, Calendar, MapPin, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, X, MessageSquare, Star } from 'lucide-react';
import { useState } from 'react';
import type { Booking, Service } from '@/types';
import ServiceCommentThread from '@/components/ServiceCommentThread';
import { localizedName, localizedDescription } from '@/utils/localize';
import { useTranslation } from 'react-i18next';

export default function ProviderDashboardPage() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const formatDateWithDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long' });
    const formatted = d.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return `${day}, ${formatted}`;
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services' | 'reviews' | 'approvals'>('overview');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: earnings } = useQuery({
    queryKey: ['earnings', user?.id],
    queryFn: () => mockApi.getProviderEarnings(user!.id),
    enabled: !!user,
  });

  const { data: bookings } = useQuery({
    queryKey: ['provider-bookings', user?.id],
    queryFn: () => mockApi.getBookings({ providerId: user!.id, role: 'PROVIDER' }),
    enabled: !!user,
  });

  const { data: services } = useQuery({
    queryKey: ['provider-services-list', user?.id],
    queryFn: () => mockApi.getServices({ providerId: user!.id }),
    enabled: !!user,
  });

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => mockApi.getCategories() });
  const { data: families } = useQuery({ queryKey: ['service-families'], queryFn: () => mockApi.getServiceFamilies() });

  const { data: allUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => mockApi.getAllUsers(),
  });
  const userMap = new Map((allUsers || []).map(u => [u.id, u]));
  const serviceMap = new Map((services || []).map(s => [s.id, s]));

  const { data: reviews } = useQuery({
    queryKey: ['provider-reviews', user?.id],
    queryFn: () => mockApi.getReviews(user!.id),
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Booking['status'] }) => mockApi.updateBookingStatus(id, status),
    onSuccess: () => {
      addNotification(t('provider.status_updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });

  const [serviceForm, setServiceForm] = useState<ServiceInput & { image?: string }>({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const saveServiceMutation = useMutation({
    mutationFn: async () => {
      const result = serviceSchema.safeParse(serviceForm);
      if (!result.success) {
        const errs: Record<string, string> = {};
        result.error.issues.forEach(i => { const k = i.path.join('.'); if (k) errs[k] = i.message; });
        setFormErrors(errs);
        throw new Error('Validation failed');
      }
      setFormErrors({});
      if (!user) return;
      if (editingServiceId) {
        return mockApi.updateService(editingServiceId, { ...serviceForm, verificationStatus: 'pending' });
      }
      return mockApi.createService({
        ...serviceForm, providerId: user.id, providerName: user.name, providerNameAr: user.nameAr || '', providerAvatar: '', providerRating: user.isVerified ? 5.0 : 0,
      });
    },
    onSuccess: () => {
      addNotification(editingServiceId ? t('provider.service_updated') : t('provider.service_submitted'), 'success');
      setShowServiceModal(false);
      setEditingServiceId(null);
      setServiceForm({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '' });
      queryClient.invalidateQueries({ queryKey: ['provider-services-list', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: () => {},
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => mockApi.deleteService(id),
    onSuccess: () => {
      addNotification(t('provider.service_deleted'), 'info');
      queryClient.invalidateQueries({ queryKey: ['provider-services-list', user?.id] });
    },
  });

  if (!user) return null;

  const translatedStatus = (s: string) => t(`bookings.status.${s.toLowerCase()}` as any) || s;

  const pendingCount = bookings?.filter(b => b.status === 'REQUESTED').length || 0;
  const activeCount = bookings?.filter(b => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length || 0;
  const completedCount = bookings?.filter(b => b.status === 'COMPLETED').length || 0;

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const calendarFirstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const calendarDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const weekDays = i18n.language === 'ar'
    ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabel = calendarDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

  const bookingsByDate = new Map<string, Booking[]>();
  (bookings || []).forEach(b => {
    const key = b.date;
    if (!bookingsByDate.has(key)) bookingsByDate.set(key, []);
    bookingsByDate.get(key)!.push(b);
  });

  const selectedDayBookings = selectedDay ? bookingsByDate.get(selectedDay) || [] : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader title={t('provider.dashboard')} subtitle={`${t('provider.subtitle', { name: user.name })}`}
        action={<Button variant="primary" onClick={() => { setEditingServiceId(null); setServiceForm({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '' }); setShowServiceModal(true); }}><Plus className="w-4 h-4 mr-1" /> {t('provider.add_service')}</Button>} />

      {/* Tabs */}
      {(() => {
        const tabLabels: Record<string, string> = { overview: t('provider.overview'), bookings: t('provider.calendar'), services: t('provider.my_services'), reviews: t('provider.reviews'), approvals: t('provider.approvals') };
        return (
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            {(['overview', 'bookings', 'services', 'reviews', 'approvals'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-primary-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">{earnings?.totalEarnings || 0}</p><p className="text-xs text-gray-500">{t('provider.total_earnings')}</p></div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-accent-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-accent-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">{earnings?.completedJobs || 0}</p><p className="text-xs text-gray-500">{t('provider.completed_jobs')}</p></div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-warning-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-warning-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">{earnings?.pendingEarnings || 0}</p><p className="text-xs text-gray-500">{t('provider.pending_earnings')}</p></div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Plus className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">{earnings?.availableForPayout || 0}</p><p className="text-xs text-gray-500">{t('provider.available_payout')}</p></div>
              </div>
            </Card>
          </div>

          {/* Earnings Chart */}
          {earnings?.monthlyEarnings && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('provider.monthly_earnings')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={earnings.monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => String(v)} />
                   <Tooltip formatter={(value: unknown) => [`${Number(value)}`, t('provider.earnings')] as [string, string]} />
                  <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Recent Bookings */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('provider.recent_bookings')}</h3>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar name={localizedName(userMap.get(booking.customerId) || { name: booking.customerName })} size="sm" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{localizedName(serviceMap.get(booking.serviceId) || { name: booking.serviceName })}</p>
                        <p className="text-xs text-gray-500">{localizedName(userMap.get(booking.customerId) || { name: booking.customerName })} · {formatDateWithDay(booking.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge>{translatedStatus(booking.status)}</Badge>
                      <p className="text-sm font-medium text-gray-900 mt-1">{booking.totalPrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t('provider.no_bookings')}</p>
            )}
          </Card>
        </div>
      )}

      {/* Bookings Tab — Calendar View */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-fade-in">
          <Card className="p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <h3 className="font-semibold text-gray-900 text-lg">{monthLabel}</h3>
              <button onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map(d => <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>)}
            </div>
            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarFirstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayBookings = bookingsByDate.get(dateStr) || [];
                const isSelected = selectedDay === dateStr;
                const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                return (
                  <button key={day} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={`relative p-2 rounded-lg text-sm text-left min-h-[3rem] transition-colors ${isSelected ? 'bg-primary-100 ring-2 ring-primary-500' : isToday ? 'bg-primary-50 font-semibold' : 'hover:bg-gray-50'}`}>
                    <span className={isToday ? 'text-primary-600 font-bold' : 'text-gray-700'}>{day}</span>
                    {dayBookings.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {dayBookings.slice(0, 3).map(b => (
                          <span key={b.id} className={`block w-2 h-2 rounded-full ${b.status === 'REQUESTED' ? 'bg-warning-400' : b.status === 'CANCELLED' ? 'bg-gray-300' : b.status === 'COMPLETED' ? 'bg-accent-500' : 'bg-primary-500'}`} />
                        ))}
                        {dayBookings.length > 3 && <span className="text-[10px] text-gray-400">+{dayBookings.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Selected Day Bookings */}
          {selectedDay && (
            <Card className="p-5">
              <h4 className="font-semibold text-gray-900 mb-3">{formatDateWithDay(selectedDay)} <span className="text-sm font-normal text-gray-500">({selectedDayBookings.length})</span></h4>
              {selectedDayBookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayBookings.map(booking => (
                    <button key={booking.id} onClick={() => setSelectedBooking(booking)}
                      className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={localizedName(userMap.get(booking.customerId) || { name: booking.customerName })} size="sm" />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{localizedName(serviceMap.get(booking.serviceId) || { name: booking.serviceName })}</p>
                            <p className="text-xs text-gray-500">{booking.time} · {localizedName(userMap.get(booking.customerId) || { name: booking.customerName })}</p>
                          </div>
                        </div>
                        <Badge>{translatedStatus(booking.status)}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('provider.no_bookings_day')}</p>
              )}
            </Card>
          )}

          {/* Booking Detail Modal */}
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBooking(null)} />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{t('provider.booking_details')}</h3>
                  <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={localizedName(userMap.get(selectedBooking.customerId) || { name: selectedBooking.customerName })} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{localizedName(userMap.get(selectedBooking.customerId) || { name: selectedBooking.customerName })}</p>
                    <Badge>{translatedStatus(selectedBooking.status)}</Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-900">{t('provider.service_name')}:</span> {localizedName(serviceMap.get(selectedBooking.serviceId) || { name: selectedBooking.serviceName })}</p>
                  <p className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDateWithDay(selectedBooking.date)} — {selectedBooking.time}</p>
                  {selectedBooking.status !== 'CANCELLED' && <p className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedBooking.address}</p>}
                  {selectedBooking.notes && <p className="bg-gray-50 p-2 rounded">{selectedBooking.notes}</p>}
                  <p className="font-medium text-gray-900 text-lg">{selectedBooking.totalPrice}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  {selectedBooking.status === 'REQUESTED' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => { statusMutation.mutate({ id: selectedBooking.id, status: 'ACCEPTED' }); setSelectedBooking(null); }}>{t('provider.accept')}</Button>
                      <Button size="sm" variant="outline" onClick={() => { statusMutation.mutate({ id: selectedBooking.id, status: 'CANCELLED' }); setSelectedBooking(null); }}>{t('provider.decline')}</Button>
                    </>
                  )}
                  {selectedBooking.status === 'ACCEPTED' && (
                    <Button size="sm" variant="primary" onClick={() => { statusMutation.mutate({ id: selectedBooking.id, status: 'IN_PROGRESS' }); setSelectedBooking(null); }} disabled={selectedBooking.paymentStatus === 'UNPAID'}>
                      {selectedBooking.paymentStatus === 'UNPAID' ? t('provider.waiting_reservation') : t('provider.start_job')}
                    </Button>
                  )}
                  {selectedBooking.status === 'IN_PROGRESS' && (
                    <Button size="sm" variant="success" onClick={() => { statusMutation.mutate({ id: selectedBooking.id, status: 'COMPLETED' }); setSelectedBooking(null); }}>{t('provider.mark_complete')}</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-fade-in">
          {services && services.length > 0 ? services.map(svc => (
            <Card key={svc.id} className="p-5">
              <div className="flex gap-4">
                <ServiceImage image={svc.image} name={localizedName(svc)} className="w-24 h-24 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{localizedName(svc)}</h3>
                    {svc.verificationStatus === 'pending' && (
                      <span className="bg-warning-100 text-warning-700 text-xs font-medium px-2 py-0.5 rounded-full">{t('bookings.status.requested')}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{localizedDescription(svc)}</p>
                  <div className="flex items-center gap-4 mt-3">
                     <span className="text-lg font-bold text-gray-900">{svc.price} <span className="text-sm font-normal text-gray-500">/ {svc.priceUnit}</span></span>
                    <StarRating rating={svc.rating} />
                    <span className="text-sm text-gray-500">{svc.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingServiceId(svc.id); setServiceForm({ name: svc.name, description: svc.description, categoryId: svc.categoryId, price: svc.price, priceUnit: svc.priceUnit, duration: svc.duration, image: svc.image || '' }); setShowServiceModal(true); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteServiceMutation.mutate(svc.id)} className="text-danger-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="p-8 text-center text-gray-500">{t('provider.no_services')}</Card>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-fade-in">
          {reviews && reviews.length > 0 ? (
            <>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}</p>
                    <StarRating rating={reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length} />
                    <p className="text-xs text-gray-500 mt-1">{t('provider.reviews_count', { count: reviews.length })}</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const pct = (count / reviews.length) * 100;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-3 text-gray-500">{star}</span>
                          <Star className="w-3 h-3 text-amber-400 fill-current" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right text-gray-400 text-xs">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
              {reviews.map(review => (
                <Card key={review.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={localizedName(userMap.get(review.customerId) || { name: review.customerName })} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{localizedName(userMap.get(review.customerId) || { name: review.customerName })}</h4>
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-400 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-primary-600 mb-1">{localizedName(serviceMap.get(review.serviceId) || { name: review.serviceName })}</p>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{t('provider.no_reviews')}</p>
            </Card>
          )}
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4 animate-fade-in">
          {services && services.filter(s => s.verificationStatus === 'pending' || s.verificationStatus === 'rejected').length > 0 ? (
            services.filter(s => s.verificationStatus === 'pending' || s.verificationStatus === 'rejected').map(svc => (
              <Card key={svc.id} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <ServiceImage image={svc.image} name={localizedName(svc)} className="w-14 h-14 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{localizedName(svc)}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${svc.verificationStatus === 'pending' ? 'bg-warning-100 text-warning-600' : 'bg-danger-100 text-danger-700'}`}>
                        {t(`provider.verification_status.${svc.verificationStatus}` as any) || svc.verificationStatus}
                      </span>
                    </div>
                     <p className="text-sm text-gray-500 mt-1">{svc.price} / {t(`provider.${svc.priceUnit.replace(/\s/g, '_')}` as any) || svc.priceUnit}</p>
                  </div>
                </div>
                <ServiceCommentThread
                  serviceId={svc.id}
                  currentUserId={user.id}
                  currentUserRole="PROVIDER"
                  currentUserName={user.name}
                  allowAttachments
                />
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{t('provider.no_service_reviews')}</p>
            </Card>
          )}
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowServiceModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingServiceId ? t('provider.edit_service') : t('provider.add_service')}</h3>
              <button onClick={() => setShowServiceModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveServiceMutation.mutate(); }} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('provider.service_name')}</label>
                <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} />
                {formErrors.name && <p className="text-xs text-danger-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('provider.description')}</label>
                <textarea rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
                {formErrors.description && <p className="text-xs text-danger-600 mt-1">{formErrors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('provider.category')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.categoryId} onChange={e => setServiceForm({ ...serviceForm, categoryId: Number(e.target.value) })}>
                    <option value="">{t('provider.select_category')}</option>
                    {(() => {
                      const activeFamilies = families?.filter(f => f.isActive) || [];
                      const grouped = new Map<number | null, typeof categories>();
                      categories?.forEach(c => {
                        const key = c.familyId && activeFamilies.some(f => String(f.id) === String(c.familyId)) ? c.familyId : null;
                        if (!grouped.has(key)) grouped.set(key, []);
                        grouped.get(key)!.push(c);
                      });
                      const result: JSX.Element[] = [];
                      for (const [familyId, cats] of grouped) {
                        if (familyId === null) {
                          result.push(<optgroup key="other" label={t('provider.other')}>{cats.map(c => <option key={c.id} value={c.id}>{c.icon} {localizedName(c)}</option>)}</optgroup>);
                        } else {
                          const family = activeFamilies.find(f => String(f.id) === String(familyId));
                          if (family) result.push(<optgroup key={familyId} label={localizedName(family)}>{cats.map(c => <option key={c.id} value={c.id}>{c.icon} {localizedName(c)}</option>)}</optgroup>);
                        }
                      }
                      return result;
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('provider.duration')}</label>
                  <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('provider.price')}</label>
                  <input type="number" required min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
                  {formErrors.price && <p className="text-xs text-danger-600 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('provider.price_unit')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.priceUnit} onChange={e => setServiceForm({ ...serviceForm, priceUnit: e.target.value })}>
                    <option value="per hour">{t('provider.per_hour')}</option>
                    <option value="per job">{t('provider.per_job')}</option>
                    <option value="per session">{t('provider.per_session')}</option>
                    <option value="per room">{t('provider.per_room')}</option>
                    <option value="per project">{t('provider.per_project')}</option>
                  </select>
                </div>
              </div>
              <ImageUpload label="Service Image" value={serviceForm.image || ''} onChange={img => setServiceForm({ ...serviceForm, image: img })} />
              {editingServiceId && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-sm text-warning-700">
                  {t('provider.pending_verification_notice')}
                </div>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={saveServiceMutation.isPending}>
                {editingServiceId ? t('provider.update_service') : t('provider.create_service')}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
