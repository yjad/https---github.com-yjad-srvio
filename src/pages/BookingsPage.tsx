import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card, Badge, Button, Avatar, EmptyState, PageHeader, Skeleton, Modal, Input } from '@/components/shared';
import { Calendar, Clock, MapPin, FileText, Star, ChevronDown, ShieldAlert, MessageSquare, Send, ArrowLeftRight } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { TransactionType, BookingMessage } from '@/types';
import { useTranslation } from 'react-i18next';
import { counterOfferSchema } from '@/schemas';
import { cn } from '@/utils/cn';
import { localizedName } from '@/utils/localize';

export default function BookingsPage() {
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', bookingId: 0 });

  const [paymentModal, setPaymentModal] = useState(false);
  const [activePayment, setActivePayment] = useState<{ bookingId: number; type: TransactionType; amount: number } | null>(null);

  const [counterOfferModal, setCounterOfferModal] = useState(false);
  const [counterOfferBookingId, setCounterOfferBookingId] = useState(0);
  const [counterOfferForm, setCounterOfferForm] = useState({ proposedDate: '', proposedTime: '', offerNote: '' });
  const [counterOfferErrors, setCounterOfferErrors] = useState<Record<string, string>>({});

  const [chatBookingId, setChatBookingId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.id, user?.role],
    queryFn: () => {
      if (!user) return [];
      return mockApi.getBookings({ userId: user.id, role: user.role, providerId: user.id });
    },
    enabled: !!user,
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => mockApi.getServices(),
  });

  const serviceMap = new Map((services || []).map(s => [s.id, s]));

  const { data: allReviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => mockApi.getReviews(),
  });

  const reviewedBookingIds = new Set((allReviews || []).map(r => r.bookingId));

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => mockApi.getAllUsers(),
  });

  const userMap = new Map((users || []).map(u => [u.id, u]));

  const { data: chatMessages, isLoading: chatLoading } = useQuery({
    queryKey: ['booking-messages', chatBookingId],
    queryFn: () => chatBookingId ? mockApi.getBookingMessages(chatBookingId) : Promise.resolve([]),
    enabled: chatBookingId !== null,
  });

  const prevMsgCount = useRef(0);
  useEffect(() => {
    const count = chatMessages?.length || 0;
    if (count > prevMsgCount.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCount.current = count;
  }, [chatMessages?.length]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      mockApi.updateBookingStatus(id, status as any),
    onSuccess: () => {
      addNotification(t('bookings.status_updated'), 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => mockApi.acceptBooking(id),
    onSuccess: () => {
      addNotification(t('counter_offer.booking_accepted'), 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-messages'] });
    },
  });

  const counterOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { proposedDate: string; proposedTime: string; offerNote?: string } }) =>
      mockApi.counterOfferBooking(id, data),
    onSuccess: () => {
      addNotification(t('counter_offer.counter_offer_sent'), 'success');
      setCounterOfferModal(false);
      setCounterOfferForm({ proposedDate: '', proposedTime: '', offerNote: '' });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-messages'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => mockApi.cancelBooking(id),
    onSuccess: () => {
      addNotification(t('counter_offer.booking_cancelled'), 'info');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-messages'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ bookingId, message }: { bookingId: number; message: string }) =>
      mockApi.sendBookingMessage(bookingId, {
        fromId: user!.id,
        fromName: user!.name,
        fromRole: user!.role,
        message,
      }),
    onSuccess: () => {
      setChatInput('');
      queryClient.invalidateQueries({ queryKey: ['booking-messages', chatBookingId] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      return mockApi.createReview({ bookingId: reviewForm.bookingId, rating: reviewForm.rating, comment: reviewForm.comment });
    },
    onSuccess: () => {
      addNotification(t('bookings.review_submitted'), 'success');
      setReviewModal(false);
      setReviewForm({ rating: 5, comment: '', bookingId: 0 });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ bookingId, type, amount }: { bookingId: number; type: TransactionType; amount: number }) => {
      return mockApi.confirmPayment(bookingId, type, amount);
    },
    onSuccess: () => {
      addNotification(t('bookings.payment_success'), 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const filtered = bookings?.filter(b => statusFilter === 'all' || b.status === statusFilter) || [];

  const statusTabs: { key: string; label: string }[] = [
    { key: 'all', label: t('bookings.all') },
    { key: 'REQUESTED', label: t('bookings.status.requested') },
    { key: 'COUNTER_OFFERED', label: t('counter_offer.negotiate') },
    { key: 'ACCEPTED', label: t('bookings.status.accepted') },
    { key: 'IN_PROGRESS', label: t('bookings.status.in_progress') },
    { key: 'COMPLETED', label: t('bookings.status.completed') },
    { key: 'CANCELLED', label: t('bookings.status.cancelled') },
  ];

  const handleCounterOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = counterOfferSchema.safeParse(counterOfferForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      setCounterOfferErrors(errors);
      return;
    }
    setCounterOfferErrors({});
    counterOfferMutation.mutate({ id: counterOfferBookingId, data: result.data });
  };

  const openCounterOffer = (bookingId: number) => {
    setCounterOfferBookingId(bookingId);
    setCounterOfferForm({ proposedDate: '', proposedTime: '', offerNote: '' });
    setCounterOfferErrors({});
    setCounterOfferModal(true);
  };

  const canNegotiate = (status: string) => status === 'REQUESTED' || status === 'COUNTER_OFFERED';
  const isNegotiating = (status: string) => status === 'REQUESTED' || status === 'COUNTER_OFFERED';
  const isLastRound = (offerRound?: number) => (offerRound || 0) >= 2;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title={user?.role === 'PROVIDER' ? t('bookings.manage_title') : user?.role === 'CUSTOMER_SERVICE' ? t('bookings.cs_title') : t('bookings.title')}
        subtitle={user?.role === 'PROVIDER' ? t('bookings.manage_subtitle') : user?.role === 'CUSTOMER_SERVICE' ? t('bookings.cs_subtitle') : t('bookings.customer_subtitle')}
      />

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {statusTabs.map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === tab.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Calendar className="w-8 h-8" />} title={t('bookings.no_bookings_found')} description={statusFilter !== 'all' ? t('bookings.no_bookings_status') : t('bookings.book_first')}
          action={<Link to="/services"><Button variant="primary">{t('bookings.browse_services')}</Button></Link>} />
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {user?.role === 'PROVIDER' && booking.paymentStatus !== 'PARTIALLY_PAID' && booking.paymentStatus !== 'FULLY_PAID' ? (
                        <Avatar name="?" size="md" />
                      ) : (
                        <Avatar name={user?.role === 'PROVIDER' ? localizedName(userMap.get(booking.customerId) || { name: booking.customerName }) : localizedName(userMap.get(booking.providerId) || { name: booking.providerName })} size="md" />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{localizedName(serviceMap.get(booking.serviceId) || { name: booking.serviceName })}</h3>
                        <p className="text-sm text-gray-500">
                          {user?.role === 'PROVIDER' && booking.paymentStatus !== 'PARTIALLY_PAID' && booking.paymentStatus !== 'FULLY_PAID'
                            ? t('bookings.hidden_until_paid')
                            : user?.role === 'PROVIDER' ? localizedName(userMap.get(booking.customerId) || { name: booking.customerName }) : localizedName(userMap.get(booking.providerId) || { name: booking.providerName })}
                        </p>
                      </div>
                    </div>

                    {/* Show proposed vs original when counter-offered */}
                    {booking.status === 'COUNTER_OFFERED' && booking.proposedDate && booking.proposedTime && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                        <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                          <ArrowLeftRight className="w-4 h-4" />
                          {t('counter_offer.negotiate')}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                          <div>
                            <span className="text-xs text-gray-400">{t('counter_offer.original_date')}</span>
                            <p>{formatDateWithDay(booking.date)} — {booking.time}</p>
                          </div>
                          <div>
                            <span className="text-xs text-amber-600">{t('counter_offer.proposed_date')}</span>
                            <p className="text-amber-800 font-medium">{formatDateWithDay(booking.proposedDate)} — {booking.proposedTime}</p>
                          </div>
                        </div>
                        {booking.offerNote && (
                          <p className="mt-2 text-xs text-gray-500 italic">{booking.offerNote}</p>
                        )}
                        {isLastRound(booking.offerRound) && (
                          <p className="mt-2 text-xs text-danger-600 font-medium">{t('counter_offer.round_warning')}</p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-3">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDateWithDay(booking.date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {booking.time}</span>
                    </div>
                    {(user?.role === 'PROVIDER' ? (booking.paymentStatus === 'PARTIALLY_PAID' || booking.paymentStatus === 'FULLY_PAID') : booking.status !== 'REQUESTED') && booking.address && (
                      <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-blue-600">{t('service_detail.address')}</span>
                          <p className="text-blue-900 font-medium">{booking.address}</p>
                        </div>
                      </div>
                    )}
                    {expandedId === booking.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5 shrink-0" /> {booking.notes || t('bookings.no_notes')}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <Badge>{t(`bookings.status.${booking.status.toLowerCase()}` as any)}</Badge>
                      <Badge variant={
                        booking.paymentStatus === 'FULLY_PAID' ? 'success' :
                          booking.paymentStatus === 'PARTIALLY_PAID' ? 'warning' :
                            'outline'
                      }>
                        {t(`bookings.payment_status.${booking.paymentStatus.toLowerCase()}` as any)}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-2">{booking.totalPrice}</p>
                    {booking.paidAmount > 0 && (
                      <p className="text-xs text-accent-600 font-medium">{t('bookings.paid')}: {booking.paidAmount}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">

                  {/* Provider: REQUESTED → accept / counter / reject */}
                  {user?.role === 'PROVIDER' && booking.status === 'REQUESTED' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => acceptMutation.mutate(booking.id)} loading={acceptMutation.isPending}>{t('counter_offer.accept_proposal')}</Button>
                      <Button size="sm" variant="primary" onClick={() => openCounterOffer(booking.id)} loading={counterOfferMutation.isPending}>
                        <ArrowLeftRight className="w-4 h-4 mr-1" /> {t('counter_offer.propose_alternative')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate(booking.id)} loading={cancelMutation.isPending}>{t('counter_offer.reject')}</Button>
                    </>
                  )}

                  {/* Provider or Customer: COUNTER_OFFERED → accept / counter / reject */}
                  {canNegotiate(booking.status) && booking.status === 'COUNTER_OFFERED' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => acceptMutation.mutate(booking.id)} loading={acceptMutation.isPending}>{t('counter_offer.accept_proposal')}</Button>
                      <Button size="sm" variant="primary" onClick={() => openCounterOffer(booking.id)} loading={counterOfferMutation.isPending}>
                        <ArrowLeftRight className="w-4 h-4 mr-1" /> {t('counter_offer.propose_alternative')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate(booking.id)} loading={cancelMutation.isPending}>{t('counter_offer.reject')}</Button>
                    </>
                  )}

                  {/* Customer: cancel REQUESTED */}
                  {user?.role === 'CUSTOMER' && booking.status === 'REQUESTED' && (
                    <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate(booking.id)} loading={cancelMutation.isPending}>{t('bookings.cancel')}</Button>
                  )}

                  {/* Customer: pay reservation */}
                  {(user?.role === 'CUSTOMER') && booking.status === 'ACCEPTED' && booking.paymentStatus === 'UNPAID' && (
                    <Button size="sm" variant="primary" onClick={async () => {
                      const intent = await mockApi.createPaymentIntent(booking.id, 'RESERVATION');
                      setActivePayment({ bookingId: booking.id, type: 'RESERVATION', amount: intent.amount });
                      setPaymentModal(true);
                    }}>
                      {t('bookings.pay_reservation')}
                    </Button>
                  )}

                  {/* Customer: pay balance */}
                  {(user?.role === 'CUSTOMER') && booking.status === 'COMPLETED' && booking.paymentStatus === 'PARTIALLY_PAID' && (
                    <Button size="sm" variant="primary" onClick={async () => {
                      const intent = await mockApi.createPaymentIntent(booking.id, 'FINAL_PAYMENT');
                      setActivePayment({ bookingId: booking.id, type: 'FINAL_PAYMENT', amount: intent.amount });
                      setPaymentModal(true);
                    }}>
                      {t('bookings.pay_balance')}
                    </Button>
                  )}

                  {user?.role === 'PROVIDER' && booking.status === 'ACCEPTED' && (
                    <Button size="sm" variant="primary" onClick={() => statusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })} loading={statusMutation.isPending} disabled={booking.paymentStatus === 'UNPAID'}>
                      {booking.paymentStatus === 'UNPAID' ? t('bookings.waiting_payment') : t('bookings.start_job')}
                    </Button>
                  )}
                  {user?.role === 'PROVIDER' && booking.status === 'IN_PROGRESS' && (
                    <Button size="sm" variant="success" onClick={() => statusMutation.mutate({ id: booking.id, status: 'COMPLETED' })} loading={statusMutation.isPending}>{t('bookings.complete_job')}</Button>
                  )}
                  {user?.role === 'CUSTOMER' && booking.status === 'COMPLETED' && !reviewedBookingIds.has(booking.id) && (
                    <Button size="sm" variant="outline" onClick={() => {
                      setReviewForm({ rating: 5, comment: '', bookingId: booking.id });
                      setReviewModal(true);
                    }}>
                      <Star className="w-4 h-4 mr-1" /> {t('bookings.leave_review')}
                    </Button>
                  )}
                  {(user?.role === 'CUSTOMER' || user?.role === 'PROVIDER') && booking.status === 'COMPLETED' && (
                    <Link to={`/disputes?create&bookingId=${booking.id}`}>
                      <Button size="sm" variant="outline">
                        <ShieldAlert className="w-4 h-4 mr-1" /> {t('bookings.dispute')}
                      </Button>
                    </Link>
                  )}

                  {/* Chat button (when negotiating or active) */}
                  {isNegotiating(booking.status) && (
                    <Button size="sm" variant="outline" onClick={() => setChatBookingId(chatBookingId === booking.id ? null : booking.id)}>
                      <MessageSquare className="w-4 h-4 mr-1" /> {t('counter_offer.messages')}
                    </Button>
                  )}

                  <button onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)} className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    {expandedId === booking.id ? t('bookings.less') : t('bookings.details')} <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === booking.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Messaging Thread */}
                {chatBookingId === booking.id && isNegotiating(booking.status) && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> {t('counter_offer.messages')}
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-3 mb-3 bg-gray-50 rounded-lg p-3">
                      {chatLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-3/4 rounded" />
                          <Skeleton className="h-8 w-1/2 rounded ml-auto" />
                        </div>
                      ) : chatMessages && chatMessages.length > 0 ? (
                        chatMessages.map((msg: BookingMessage) => (
                          <div key={msg.id} className={cn('flex flex-col', msg.type === 'system' ? 'items-center' : msg.fromId === user?.id ? 'items-end' : 'items-start')}>
                            {msg.type === 'system' ? (
                              <span className="text-xs text-gray-400 italic bg-white px-3 py-1 rounded-full">{msg.message}</span>
                            ) : (
                              <div className={cn('max-w-xs lg:max-w-md rounded-lg px-3 py-2 text-sm', msg.fromId === user?.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={cn('text-xs font-medium', msg.fromId === user?.id ? 'text-primary-100' : 'text-gray-500')}>{msg.fromName}</span>
                                  <Badge className="text-[10px] px-1 py-0">{msg.fromRole}</Badge>
                                </div>
                                <p>{msg.message}</p>
                                <p className={cn('text-[10px] mt-1', msg.fromId === user?.id ? 'text-primary-200' : 'text-gray-400')}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">{t('counter_offer.send_message')}</p>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={e => {
                      e.preventDefault();
                      if (!chatInput.trim() || !chatBookingId) return;
                      sendMessageMutation.mutate({ bookingId: chatBookingId, message: chatInput.trim() });
                    }} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder={t('counter_offer.send_message')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button type="submit" size="sm" variant="primary" loading={sendMessageMutation.isPending} disabled={!chatInput.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Counter-Offer Modal */}
      <Modal isOpen={counterOfferModal} onClose={() => setCounterOfferModal(false)} title={t('counter_offer.propose_alternative')}>
        <form onSubmit={handleCounterOfferSubmit} className="space-y-4">
          <Input
            label={t('counter_offer.proposed_date')}
            type="date"
            value={counterOfferForm.proposedDate}
            onChange={e => setCounterOfferForm({ ...counterOfferForm, proposedDate: e.target.value })}
            error={counterOfferErrors.proposedDate}
            required
          />
          <Input
            label={t('counter_offer.proposed_time')}
            type="time"
            value={counterOfferForm.proposedTime}
            onChange={e => setCounterOfferForm({ ...counterOfferForm, proposedTime: e.target.value })}
            error={counterOfferErrors.proposedTime}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('counter_offer.offer_note')}</label>
            <textarea
              rows={3}
              value={counterOfferForm.offerNote}
              onChange={e => setCounterOfferForm({ ...counterOfferForm, offerNote: e.target.value })}
              placeholder={t('counter_offer.offer_note')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCounterOfferModal(false)} className="flex-1">{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" loading={counterOfferMutation.isPending} className="flex-1">{t('counter_offer.propose_alternative')}</Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title={t('bookings.leave_review')}>
        <form onSubmit={e => { e.preventDefault(); reviewMutation.mutate(); }} className="space-y-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: i })}>
                <Star className={`w-8 h-8 ${i <= reviewForm.rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea rows={4} placeholder={t('bookings.share_experience')} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={reviewMutation.isPending}>{t('bookings.submit_review')}</Button>
        </form>
      </Modal>

      {/* Payment Modal */}
      {activePayment && (
        <PaymentModal
          isOpen={paymentModal}
          onClose={() => {
            setPaymentModal(false);
            setActivePayment(null);
          }}
          onSuccess={() => {
            paymentMutation.mutate(activePayment);
          }}
          amount={activePayment.amount}
          title={activePayment.type === 'RESERVATION' ? t('bookings.pay_reservation_fee') : t('bookings.final_settlement')}
          description={activePayment.type === 'RESERVATION' ? t('bookings.reservation_desc') : t('bookings.final_desc')}
        />
      )}
    </div>
  );
}
