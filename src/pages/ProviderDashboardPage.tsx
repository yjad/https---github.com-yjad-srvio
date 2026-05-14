import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card, Badge, Button, Avatar, StarRating, PageHeader, ServiceImage, ImageUpload } from '@/components/shared';
import { serviceSchema, type ServiceInput } from '@/schemas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, DollarSign, Briefcase, CheckCircle, Clock, Calendar, MapPin, ChevronDown, Edit2, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { Booking } from '@/types';

export default function ProviderDashboardPage() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services'>('overview');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);

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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Booking['status'] }) => mockApi.updateBookingStatus(id, status),
    onSuccess: () => {
      addNotification('Status updated', 'success');
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
        ...serviceForm, providerId: user.id, providerName: user.name, providerAvatar: '', providerRating: user.isVerified ? 5.0 : 0,
      });
    },
    onSuccess: () => {
      addNotification(editingServiceId ? 'Service updated!' : 'Service created!', 'success');
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
      addNotification('Service deleted', 'info');
      queryClient.invalidateQueries({ queryKey: ['provider-services-list', user?.id] });
    },
  });

  if (!user) return null;

  const pendingCount = bookings?.filter(b => b.status === 'REQUESTED').length || 0;
  const activeCount = bookings?.filter(b => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length || 0;
  const completedCount = bookings?.filter(b => b.status === 'COMPLETED').length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader title="Provider Dashboard" subtitle={`Welcome back, ${user.name}`}
        action={<Button variant="primary" onClick={() => { setEditingServiceId(null); setServiceForm({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '' }); setShowServiceModal(true); }}><Plus className="w-4 h-4 mr-1" /> Add Service</Button>} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['overview', 'bookings', 'services'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-primary-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">${earnings?.totalEarnings || 0}</p><p className="text-xs text-gray-500">Total Revenue</p></div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-accent-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-accent-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">${earnings?.completedJobs || 0}</p><p className="text-xs text-gray-500">Completed Jobs</p></div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-warning-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-warning-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">${earnings?.pendingEarnings || 0}</p><p className="text-xs text-gray-500">Pending Clearance</p></div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Plus className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-gray-900">${earnings?.availableForPayout || 0}</p><p className="text-xs text-gray-500">Available to Payout</p></div>
              </div>
            </Card>
          </div>

          {/* Earnings Chart */}
          {earnings?.monthlyEarnings && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Earnings</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={earnings.monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(value: unknown) => [`$${Number(value)}`, 'Earnings'] as [string, string]} />
                  <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Recent Bookings */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Bookings</h3>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar name={booking.customerName} size="sm" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{booking.serviceName}</p>
                        <p className="text-xs text-gray-500">{booking.customerName} · {booking.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge>{booking.status}</Badge>
                      <p className="text-sm font-medium text-gray-900 mt-1">${booking.totalPrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No bookings yet</p>
            )}
          </Card>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-fade-in">
          {bookings && bookings.length > 0 ? bookings.map(booking => (
            <Card key={booking.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={booking.customerName} size="md" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.serviceName}</h3>
                    <p className="text-sm text-gray-500">{booking.customerName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {booking.date} at {booking.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {booking.address}</span>
                    </div>
                    {expandedBooking === booking.id && booking.notes && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">{booking.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge>{booking.status}</Badge>
                  <p className="text-lg font-bold mt-2">${booking.totalPrice}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                {booking.status === 'REQUESTED' && (
                  <>
                    <Button size="sm" variant="success" onClick={() => statusMutation.mutate({ id: booking.id, status: 'ACCEPTED' })}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: booking.id, status: 'CANCELLED' })}>Decline</Button>
                  </>
                )}
                {booking.status === 'ACCEPTED' && (
                  <Button size="sm" variant="primary" onClick={() => statusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })} disabled={booking.paymentStatus === 'UNPAID'}>
                    {booking.paymentStatus === 'UNPAID' ? 'Waiting for Reservation' : 'Start Job'}
                  </Button>
                )}
                {booking.status === 'IN_PROGRESS' && (
                  <Button size="sm" variant="success" onClick={() => statusMutation.mutate({ id: booking.id, status: 'COMPLETED' })}>Mark Complete</Button>
                )}
                <button onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)} className="ml-auto flex items-center gap-1 text-sm text-gray-500">
                  {expandedBooking === booking.id ? 'Less' : 'Details'} <ChevronDown className={`w-4 h-4 transition-transform ${expandedBooking === booking.id ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </Card>
          )) : (
            <Card className="p-8 text-center text-gray-500">No bookings found</Card>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-fade-in">
          {services && services.length > 0 ? services.map(svc => (
            <Card key={svc.id} className="p-5">
              <div className="flex gap-4">
                <ServiceImage image={svc.image} name={svc.name} className="w-24 h-24 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                    {svc.verificationStatus === 'pending' && (
                      <span className="bg-warning-100 text-warning-700 text-xs font-medium px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{svc.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-lg font-bold text-gray-900">${svc.price} <span className="text-sm font-normal text-gray-500">/ {svc.priceUnit}</span></span>
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
            <Card className="p-8 text-center text-gray-500">No services yet. Add your first service!</Card>
          )}
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowServiceModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={() => setShowServiceModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveServiceMutation.mutate(); }} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} />
                {formErrors.name && <p className="text-xs text-danger-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
                {formErrors.description && <p className="text-xs text-danger-600 mt-1">{formErrors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.categoryId} onChange={e => setServiceForm({ ...serviceForm, categoryId: Number(e.target.value) })}>
                    {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input type="number" required min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
                  {formErrors.price && <p className="text-xs text-danger-600 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Unit</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={serviceForm.priceUnit} onChange={e => setServiceForm({ ...serviceForm, priceUnit: e.target.value })}>
                    <option value="per hour">Per Hour</option>
                    <option value="per job">Per Job</option>
                    <option value="per session">Per Session</option>
                    <option value="per room">Per Room</option>
                    <option value="per project">Per Project</option>
                  </select>
                </div>
              </div>
              <ImageUpload label="Service Image" value={serviceForm.image || ''} onChange={img => setServiceForm({ ...serviceForm, image: img })} />
              {editingServiceId && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-sm text-warning-700">
                  After saving, this service will be set to <strong>pending verification</strong> until a Customer Service agent approves the changes.
                </div>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={saveServiceMutation.isPending}>
                {editingServiceId ? 'Update Service' : 'Create Service'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
