import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card, Badge, Button, Avatar, EmptyState, PageHeader, Skeleton, Modal } from '@/components/shared';
import { Calendar, Clock, MapPin, FileText, Star, ChevronDown, ShieldAlert } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { TransactionType } from '@/types';

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', bookingId: 0 });

  // Payment state
  const [paymentModal, setPaymentModal] = useState(false);
  const [activePayment, setActivePayment] = useState<{ bookingId: number; type: TransactionType; amount: number } | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.id, user?.role],
    queryFn: () => {
      if (!user) return [];
      return mockApi.getBookings({ userId: user.id, role: user.role, providerId: user.id });
    },
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      mockApi.updateBookingStatus(id, status as any),
    onSuccess: () => {
      addNotification('Booking status updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      return mockApi.createReview({ bookingId: reviewForm.bookingId, rating: reviewForm.rating, comment: reviewForm.comment });
    },
    onSuccess: () => {
      addNotification('Review submitted! Thank you.', 'success');
      setReviewModal(false);
      setReviewForm({ rating: 5, comment: '', bookingId: 0 });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ bookingId, type, amount }: { bookingId: number; type: TransactionType; amount: number }) => {
      return mockApi.confirmPayment(bookingId, type, amount);
    },
    onSuccess: () => {
      addNotification('Payment successful!', 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const filtered = bookings?.filter(b => statusFilter === 'all' || b.status === statusFilter) || [];

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
        title={user?.role === 'PROVIDER' ? 'Manage Bookings' : user?.role === 'CUSTOMER_SERVICE' ? 'Platform Bookings' : 'My Bookings'}
        subtitle={user?.role === 'PROVIDER' ? 'Accept and manage incoming service requests' : user?.role === 'CUSTOMER_SERVICE' ? 'Monitor and manage all service requests across the platform' : 'Track your service bookings'}
      />

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => (
          <button key={status} onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Calendar className="w-8 h-8" />} title="No bookings found" description={statusFilter !== 'all' ? 'No bookings with this status' : 'Book your first service to get started'}
          action={<Link to="/services"><Button variant="primary">Browse Services</Button></Link>} />
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={user?.role === 'PROVIDER' ? booking.customerName : booking.providerName} size="md" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{booking.serviceName}</h3>
                        <p className="text-sm text-gray-500">
                          {user?.role === 'PROVIDER' ? booking.customerName : booking.providerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-3">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {booking.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {booking.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {booking.address}</span>
                    </div>
                    {expandedId === booking.id && booking.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5 shrink-0" /> {booking.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <Badge>{booking.status}</Badge>
                      <Badge variant={
                        booking.paymentStatus === 'FULLY_PAID' ? 'success' :
                          booking.paymentStatus === 'PARTIALLY_PAID' ? 'warning' :
                            'outline'
                      }>
                        {booking.paymentStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-2">${booking.totalPrice}</p>
                    {booking.paidAmount > 0 && (
                      <p className="text-xs text-accent-600 font-medium">Paid: ${booking.paidAmount}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                  {user?.role === 'PROVIDER' && booking.status === 'REQUESTED' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => statusMutation.mutate({ id: booking.id, status: 'ACCEPTED' })} loading={statusMutation.isPending}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: booking.id, status: 'CANCELLED' })} loading={statusMutation.isPending}>Reject</Button>
                    </>
                  )}

                  {/* Customer Payment Actions */}
                  {(user?.role === 'CUSTOMER') && booking.status === 'ACCEPTED' && booking.paymentStatus === 'UNPAID' && (
                    <Button size="sm" variant="primary" onClick={async () => {
                      const intent = await mockApi.createPaymentIntent(booking.id, 'RESERVATION');
                      setActivePayment({ bookingId: booking.id, type: 'RESERVATION', amount: intent.amount });
                      setPaymentModal(true);
                    }}>
                      Pay Reservation
                    </Button>
                  )}

                  {(user?.role === 'CUSTOMER') && booking.status === 'COMPLETED' && booking.paymentStatus === 'PARTIALLY_PAID' && (
                    <Button size="sm" variant="primary" onClick={async () => {
                      const intent = await mockApi.createPaymentIntent(booking.id, 'FINAL_PAYMENT');
                      setActivePayment({ bookingId: booking.id, type: 'FINAL_PAYMENT', amount: intent.amount });
                      setPaymentModal(true);
                    }}>
                      Pay Balance
                    </Button>
                  )}

                  {user?.role === 'PROVIDER' && booking.status === 'ACCEPTED' && (
                    <Button size="sm" variant="primary" onClick={() => statusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })} loading={statusMutation.isPending} disabled={booking.paymentStatus === 'UNPAID'}>
                      {booking.paymentStatus === 'UNPAID' ? 'Waiting for Payment' : 'Start Job'}
                    </Button>
                  )}
                  {user?.role === 'PROVIDER' && booking.status === 'IN_PROGRESS' && (
                    <Button size="sm" variant="success" onClick={() => statusMutation.mutate({ id: booking.id, status: 'COMPLETED' })} loading={statusMutation.isPending}>Complete Job</Button>
                  )}
                  {user?.role === 'CUSTOMER' && booking.status === 'COMPLETED' && (
                    <Button size="sm" variant="outline" onClick={() => {
                      setReviewForm({ rating: 5, comment: '', bookingId: booking.id });
                      setReviewModal(true);
                    }}>
                      <Star className="w-4 h-4 mr-1" /> Leave Review
                    </Button>
                  )}
                  {(user?.role === 'CUSTOMER' || user?.role === 'PROVIDER') && booking.status === 'COMPLETED' && (
                    <Link to={`/disputes?create&bookingId=${booking.id}`}>
                      <Button size="sm" variant="outline">
                        <ShieldAlert className="w-4 h-4 mr-1" /> Dispute
                      </Button>
                    </Link>
                  )}
                  {user?.role === 'CUSTOMER' && booking.status === 'REQUESTED' && (
                    <Button size="sm" variant="danger" onClick={() => statusMutation.mutate({ id: booking.id, status: 'CANCELLED' })} loading={statusMutation.isPending}>Cancel</Button>
                  )}
                  <button onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)} className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    {expandedId === booking.id ? 'Less' : 'Details'} <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === booking.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Leave a Review">
        <form onSubmit={e => { e.preventDefault(); reviewMutation.mutate(); }} className="space-y-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: i })}>
                <Star className={`w-8 h-8 ${i <= reviewForm.rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea rows={4} placeholder="Share your experience..." required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={reviewMutation.isPending}>Submit Review</Button>
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
          title={activePayment.type === 'RESERVATION' ? 'Pay Reservation Fee' : 'Final Settlement'}
          description={activePayment.type === 'RESERVATION' ? 'Secure your booking by paying the reservation fee.' : 'Complete the payment for the finished service.'}
        />
      )}
    </div>
  );
}
