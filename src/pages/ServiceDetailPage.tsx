import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Avatar, StarRating, Button, Skeleton, Card, Badge, Modal, ServiceImage } from '@/components/shared';
import { bookingSchema } from '@/schemas';
import { Clock, MapPin, Star, ArrowLeft, Shield, MessageSquare } from 'lucide-react';

const categoryGradients: Record<number, string> = {
  1: 'from-blue-400 to-blue-600', 2: 'from-green-400 to-green-600', 3: 'from-amber-400 to-amber-600',
  4: 'from-purple-400 to-purple-600', 5: 'from-pink-400 to-pink-600', 6: 'from-teal-400 to-teal-600',
};
const categoryIcons = ['🔧', '🧹', '⚡', '🛠️', '🎨', '🌿'];

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();
  const [bookingModal, setBookingModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', address: '', notes: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', bookingId: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const serviceId = Number(id);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => mockApi.getServiceById(serviceId),
    enabled: !!serviceId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', serviceId],
    queryFn: () => mockApi.getReviews(undefined, serviceId),
    enabled: !!serviceId,
  });

  const { data: providerServices } = useQuery({
    queryKey: ['provider-services', service?.providerId],
    queryFn: () => mockApi.getServices().then(all => all.filter(s => s.providerId === service?.providerId)),
    enabled: !!service?.providerId,
  });

  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => mockApi.getSystemSettings(),
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: typeof bookingForm) => {
      const result = bookingSchema.safeParse({ serviceId, date: data.date, time: data.time, address: data.address, notes: data.notes });
      if (!result.success) {
        const errs: Record<string, string> = {};
        result.error.issues.forEach(i => { const k = i.path.join('.'); if (k) errs[k] = i.message; });
        setFormErrors(errs);
        throw new Error('Validation failed');
      }
      setFormErrors({});
      return mockApi.createBooking({
        serviceId, customerId: user!.id, date: data.date, time: data.time,
        address: data.address, notes: data.notes || '',
      });
    },
    onSuccess: () => {
      addNotification('Booking created successfully!', 'success');
      setBookingModal(false);
      setBookingForm({ date: '', time: '', address: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => {},
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      return mockApi.createReview({ bookingId: reviewForm.bookingId, rating: reviewForm.rating, comment: reviewForm.comment });
    },
    onSuccess: () => {
      addNotification('Review submitted! Thank you.', 'success');
      setReviewModal(false);
      queryClient.invalidateQueries({ queryKey: ['reviews', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-32" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
        <p className="text-gray-500 mb-4">The service you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/services" className="text-primary-600 font-medium">Browse all services →</Link>
      </div>
    );
  }

  const gradient = categoryGradients[service.categoryId] || 'from-gray-400 to-gray-500';
  const icon = categoryIcons[service.categoryId - 1] || '🔧';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Image */}
        <div className="relative">
          <ServiceImage
            image={service.image}
            name={service.name}
            fallback={
              <div className={`h-72 md:h-96 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center`}>
                <span className="text-7xl">{icon}</span>
              </div>
            }
            className="h-72 md:h-96 w-full rounded-2xl"
          />
        </div>

        {/* Info */}
        <div>
          <Badge className="mb-3">{service.categoryId && categoryIcons[service.categoryId - 1]} Service</Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={service.rating} size="md" />
            <span className="text-sm text-gray-500">({service.reviewCount} reviews)</span>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5 text-primary-600" />
              <div><p className="text-xs text-gray-400">Duration</p><p className="font-medium text-sm">{service.duration}</p></div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-5 h-5 text-accent-600" />
              <div><p className="text-xs text-gray-400">Verified</p><p className="font-medium text-sm">Background checked</p></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Starting from</p>
                <p className="text-3xl font-bold text-gray-900">${service.price}</p>
                <p className="text-sm text-gray-500">{service.priceUnit}</p>
              </div>
              <Button variant="primary" size="lg" onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return; }
                setBookingModal(true);
              }}>
                Book Now
              </Button>
            </div>
          </div>

          {/* Provider Info */}
          <div className="flex items-center gap-3 p-4 border rounded-xl">
            <Avatar name={service.providerName} size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{service.providerName}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-current" /> {service.providerRating} rating</p>
            </div>
            <Link to={`/services?provider=${service.providerId}`} className="text-sm text-primary-600 font-medium">View Profile</Link>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews ({reviews?.length || 0})</h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={review.customerName} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{review.customerName}</p>
                        <StarRating rating={review.rating} />
                      </div>
                      <span className="text-xs text-gray-400">{review.createdAt}</span>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">{review.comment}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No reviews yet. Be the first to review this service!</p>
          </div>
        )}
      </div>

      {/* Other services by provider */}
      {providerServices && providerServices.length > 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">More from {service.providerName}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providerServices.filter(s => s.id !== service.id).slice(0, 3).map(s => (
              <Link key={s.id} to={`/services/${s.id}`}>
                <Card className="p-4 hover:shadow-md transition-all">
                  <h4 className="font-medium text-gray-900">{s.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{s.duration} · ${s.price} {s.priceUnit}</p>
                  <div className="mt-2"><StarRating rating={s.rating} /></div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal isOpen={bookingModal} onClose={() => setBookingModal(false)} title="Book Service">
        <form onSubmit={e => {
          e.preventDefault();
          bookingMutation.mutate(bookingForm);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <p className="text-gray-900 font-medium">{service.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
              {formErrors.date && <p className="text-xs text-danger-600 mt-1">{formErrors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={bookingForm.time} onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}
              />
              {formErrors.time && <p className="text-xs text-danger-600 mt-1">{formErrors.time}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" required placeholder="Your service address" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={bookingForm.address} onChange={e => setBookingForm({ ...bookingForm, address: e.target.value })}
              />
            </div>
            {formErrors.address && <p className="text-xs text-danger-600 mt-1">{formErrors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea rows={3} placeholder="Any special instructions..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              value={bookingForm.notes} onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service Price</span>
              <span className="font-medium text-gray-900">${service.price}</span>
            </div>
            <div className="flex justify-between text-sm italic">
              <span className="text-gray-400">Tax</span>
              <span className="font-medium text-gray-400">Included</span>
            </div>
            <div className="pt-2 border-t flex justify-between items-baseline">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-primary-600">
                ${service.price.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic">
              * A {settings?.reservationPercentage}% reservation fee (${(service.price * (settings?.reservationPercentage || 0) / 100).toFixed(2)}) will be required once the provider accepts your request.
            </p>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={bookingMutation.isPending}>
            Confirm Booking — ${service.price.toFixed(2)}
          </Button>
        </form>
      </Modal>

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
    </div>
  );
}
