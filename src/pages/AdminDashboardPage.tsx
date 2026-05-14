import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import type { Category } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, Briefcase, DollarSign, CheckCircle, AlertCircle, TrendingUp, Shield, Star } from 'lucide-react';
import { useState } from 'react';
import { Card, Badge, Avatar, PageHeader, Skeleton, Modal, DataTable, Button, ServiceImage, ImageUpload, type Column } from '@/components/shared';
import type { User, Service, Booking } from '@/types';

const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'bookings' | 'reviews' | 'services' | 'categories' | 'financials'
  >('overview');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => mockApi.getAdminStats(),
  });

  const { data: services } = useQuery({ queryKey: ['services'], queryFn: () => mockApi.getServices() });
  const { data: categories } = useQuery({ queryKey: ['all-categories'], queryFn: () => mockApi.getAllCategories() });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => mockApi.getAllUsers() });
  const { data: allBookings } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => mockApi.getAllBookings() });
  const { data: allReviews } = useQuery({ queryKey: ['admin-reviews'], queryFn: () => mockApi.getAllReviews() });
  const { data: transactions } = useQuery({ queryKey: ['admin-transactions'], queryFn: () => mockApi.getTransactions() });
  const queryClient = useQueryClient();

  const toggleService = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => mockApi.updateService(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const toggleCategory = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => mockApi.updateCategory(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-categories'] }),
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const createCategory = useMutation({
    mutationFn: (data: Partial<Category>) => mockApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
      setShowAddCategory(false);
    },
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) => mockApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
      setEditCategory(null);
    },
  });

  const [editUser, setEditUser] = useState<User | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '', providerId: 1 });
  const [serviceFormErrors, setServiceFormErrors] = useState<Record<string, string>>({});

  const createServiceMutation = useMutation({
    mutationFn: () => {
      return mockApi.createService({
        ...serviceForm,
        providerName: users?.find(u => u.id === serviceForm.providerId)?.name || '',
        providerAvatar: '',
        providerRating: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowServiceModal(false);
      setServiceForm({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '', providerId: 1 });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: () => {
      if (!editingService) throw new Error('No service selected');
      return mockApi.updateService(editingService.id, serviceForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditingService(null);
      setShowServiceModal(false);
    },
  });
  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => mockApi.adminUpdateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
    },
  });
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Customers', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Providers', value: stats?.totalProviders || 0, icon: Shield, color: 'bg-green-100 text-green-600' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: Briefcase, color: 'bg-purple-100 text-purple-600' },
    { label: 'Revenue', value: `$${stats?.totalRevenue || 0}`, icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        {(['overview', 'users', 'bookings', 'reviews', 'services', 'categories', 'financials'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {/* Keep existing secondary stats, charts, revenue‑by‑category sections from original file here */}
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          <DataTable
            data={users || []}
            columns={[
              {
                header: 'User',
                accessor: (u: User) => (
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium">{u.name}</span>
                  </div>
                ),
                sortable: true,
                sortKey: 'name',
              },
              { header: 'Email', accessor: 'email', sortable: true },
              { header: 'Role', accessor: (u: User) => <Badge>{u.role}</Badge>, sortable: true, sortKey: 'role' },
              {
                header: 'Language',
                accessor: (u: User) => u.preferredLanguage === 'en' ? 'English' : u.preferredLanguage === 'fr' ? 'French' : u.preferredLanguage,
                sortable: true,
                sortKey: 'preferredLanguage'
              },
              { header: 'Joined', accessor: 'joinDate', sortable: true },
              { header: 'Status', accessor: (u: User) => <Badge>{u.isVerified ? 'Verified' : 'Pending'}</Badge>, sortable: true, sortKey: 'isVerified' },
              {
                header: 'Actions',
                accessor: (u: User) => (
                  <button
                    className="text-sm text-blue-600 underline"
                    onClick={() => setEditUser(u)}
                  >
                    Edit
                  </button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Services */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">All Services</h2>
            <Button variant="primary" onClick={() => { setEditingService(null); setShowServiceModal(true); }}>Add Service</Button>
          </div>
          <DataTable
            data={services || []}
            columns={[
              { header: 'ID', accessor: (s: Service) => <span className="font-mono text-xs">#{s.id}</span>, sortable: true, sortKey: 'id' },
              {
                header: 'Image',
                accessor: (s: Service) => <ServiceImage image={s.image} name={s.name} className="w-10 h-10 rounded-lg" />,
              },
              { header: 'Name', accessor: 'name', sortable: true },
              { header: 'Provider', accessor: 'providerName', sortable: true },
              { header: 'Category', accessor: 'categoryId', sortable: true },
              { header: 'Price', accessor: (s: Service) => `$${s.price}`, sortable: true, sortKey: 'price' },
              { header: 'Status', accessor: (s: Service) => <Badge>{s.isActive ? 'Active' : 'Inactive'}</Badge>, sortable: true, sortKey: 'isActive' },
              {
                header: 'Actions',
                accessor: (s: Service) => (
                  <div className="flex items-center gap-2">
                    <button className="text-sm text-blue-600 underline" onClick={() => toggleService.mutate({ id: s.id, isActive: !s.isActive })} disabled={toggleService.isPending}>
                      {s.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="text-sm text-blue-600 underline" onClick={() => { setEditingService(s); setServiceForm({ name: s.name, description: s.description, categoryId: s.categoryId, price: s.price, priceUnit: s.priceUnit, duration: s.duration, image: s.image || '', providerId: s.providerId }); setShowServiceModal(true); }}>
                      Edit
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-fade-in">
          <DataTable
            data={allBookings || []}
            columns={[
              { 
                header: 'ID', 
                accessor: (b: Booking) => (
                  <button 
                    className="font-mono text-xs text-blue-600 hover:underline"
                    onClick={() => setSelectedBooking(b)}
                  >
                    #{b.id}
                  </button>
                ), 
                sortable: true, 
                sortKey: 'id' 
              },
              { header: 'Customer', accessor: 'customerName', sortable: true },
              { header: 'Service', accessor: 'serviceName', sortable: true },
              { header: 'Date', accessor: 'date', sortable: true, className: 'text-gray-500' },
              { header: 'Status', accessor: (b: Booking) => <Badge>{b.status}</Badge>, sortable: true, sortKey: 'status' },
              { header: 'Amount', accessor: (b: Booking) => `$${b.totalPrice}`, sortable: true, sortKey: 'totalPrice', className: 'font-medium' },
            ]}
          />
        </div>
      )}

      {/* Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-fade-in">
          {allReviews?.map(review => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={review.customerName} size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{review.customerName} reviewed {review.serviceName}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{review.createdAt}</span>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">{review.comment}</p>
                </div>
              </div>
            </Card>
          ))}
          {(!allReviews || allReviews.length === 0) && (
            <Card className="p-8 text-center text-gray-500">No reviews yet</Card>
          )}
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Button
              variant="primary"
              onClick={() => setShowAddCategory(true)}
            >
              Add Category
            </Button>
          </div>
          <DataTable
            data={categories || []}
            columns={[
              { header: 'ID', accessor: (c: Category) => <span className="font-mono text-xs">#{c.id}</span>, sortable: true, sortKey: 'id' },
              { header: 'Icon', accessor: 'icon' },
              { header: 'Name', accessor: 'name', sortable: true },
              { header: 'Description', accessor: 'description', className: 'max-w-xs truncate' },
              { header: 'Color', accessor: (c: Category) => <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></span> },
              { header: 'Activation Date', accessor: 'activationDate', sortable: true },
              { header: 'Status', accessor: (c: Category) => <Badge>{c.isActive ? 'Active' : 'Inactive'}</Badge>, sortable: true, sortKey: 'isActive' },
              {
                header: 'Actions',
                accessor: (c: Category) => (
                  <div className="flex items-center gap-2">
                    <button
                      className="text-sm text-blue-600 underline"
                      onClick={() => toggleCategory.mutate({ id: c.id, isActive: !c.isActive })}
                      disabled={toggleCategory.isPending}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="text-sm text-blue-600 underline"
                      onClick={() => setEditCategory(c)}
                    >
                      Edit
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Financials */}
      {activeTab === 'financials' && (
        <div className="space-y-4 animate-fade-in">
          <DataTable
            data={transactions || []}
            columns={[
              { header: 'ID', accessor: (t: any) => <span className="font-mono text-xs">#{t.id}</span> },
              { 
                header: 'Booking', 
                accessor: (t: any) => (
                  <button 
                    className="font-mono text-xs text-blue-600 hover:underline"
                    onClick={() => setSelectedBooking(allBookings?.find(b => b.id === t.bookingId) || null)}
                  >
                    #{t.bookingId}
                  </button>
                ) 
              },
              { header: 'Type', accessor: (t: any) => <Badge>{t.type}</Badge> },
              { header: 'Amount', accessor: (t: any) => `$${(t.amount / 100).toFixed(2)}`, className: 'font-medium' },
              { header: 'Commission Tax', accessor: (t: any) => `$${allBookings?.find(b => b.id === t.bookingId)?.platformTax || 0}`, className: 'text-gray-500 text-sm' },
              { header: 'Stripe ID', accessor: 'stripePaymentIntentId', className: 'font-mono text-xs text-gray-400' },
              { header: 'Date', accessor: (t: any) => t.createdAt.split('T')[0] },
              { header: 'Status', accessor: (t: any) => <Badge variant="success">{t.status}</Badge> },
            ]}
          />
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          <Card className="p-6 max-w-2xl">
            <h3 className="text-lg font-semibold mb-6">Financial & Operational Parameters</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                reservationPercentage: Number(formData.get('reservationPercentage')),
                taxPercentage: Number(formData.get('taxPercentage')),
                platformCommissionPercentage: Number(formData.get('platformCommissionPercentage')),
                payoutDelayDays: Number(formData.get('payoutDelayDays')),
                customerFreeCancellationHours: Number(formData.get('customerFreeCancellationHours')),
                vendorFreeCancellationHours: Number(formData.get('vendorFreeCancellationHours')),
              };
              updateSettingsMutation.mutate(data);
            }} className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Reservation %</label>
                <input name="reservationPercentage" type="number" defaultValue={systemSettings?.reservationPercentage} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tax (GST/HST) %</label>
                <input name="taxPercentage" type="number" defaultValue={systemSettings?.taxPercentage} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Platform Commission %</label>
                <input name="platformCommissionPercentage" type="number" defaultValue={systemSettings?.platformCommissionPercentage} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Payout Delay (Days)</label>
                <input name="payoutDelayDays" type="number" defaultValue={systemSettings?.payoutDelayDays} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Customer Free Cancel (Hrs)</label>
                <input name="customerFreeCancellationHours" type="number" defaultValue={systemSettings?.customerFreeCancellationHours} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Provider Free Cancel (Hrs)</label>
                <input name="vendorFreeCancellationHours" type="number" defaultValue={systemSettings?.vendorFreeCancellationHours} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="col-span-2 pt-4">
                <Button type="submit" loading={updateSettingsMutation.isPending} className="w-full">
                  Save System Parameters
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Modal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} title="Add Category">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createCategory.mutate({
              name: formData.get('name') as string,
              icon: formData.get('icon') as string,
              description: formData.get('description') as string,
              color: formData.get('color') as string,
              activationDate: formData.get('activationDate') as string || new Date().toISOString().split('T')[0],
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Icon (emoji)</label>
            <input name="icon" required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" placeholder="🔧" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input type="color" name="color" required className="mt-1 block w-full h-10 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Activation Date</label>
            <input type="date" name="activationDate" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddCategory(false)}>Cancel</Button>
            <Button type="submit" loading={createCategory.isPending}>
              Add Category
            </Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={!!editCategory} onClose={() => setEditCategory(null)} title="Edit Category">
        {editCategory && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateCategory.mutate({
                id: editCategory.id,
                data: {
                  name: formData.get('name') as string,
                  icon: formData.get('icon') as string,
                  description: formData.get('description') as string,
                  color: formData.get('color') as string,
                  activationDate: formData.get('activationDate') as string,
                  isActive: formData.get('isActive') === 'true',
                },
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input name="name" defaultValue={editCategory.name} required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Icon (emoji)</label>
              <input name="icon" defaultValue={editCategory.icon} required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" defaultValue={editCategory.description} required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <input type="color" name="color" defaultValue={editCategory.color} required className="mt-1 block w-full h-10 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Activation Date</label>
              <input type="date" name="activationDate" defaultValue={editCategory.activationDate} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="isActive" defaultValue={editCategory.isActive?.toString() || 'true'} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditCategory(null)}>Cancel</Button>
              <Button type="submit" loading={updateCategory.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details">
        {selectedBooking && (() => {
          const review = allReviews?.find(r => r.bookingId === selectedBooking.id);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-gray-500">Booking ID:</span> #{selectedBooking.id}</div>
                <div><span className="font-medium text-gray-500">Created:</span> {selectedBooking.createdAt}</div>
                
                <div className="col-span-2"><span className="font-medium text-gray-500">Customer:</span> {selectedBooking.customerName} ({selectedBooking.customerEmail})</div>
                <div><span className="font-medium text-gray-500">Provider:</span> {selectedBooking.providerName}</div>
                <div><span className="font-medium text-gray-500">Service:</span> {selectedBooking.serviceName}</div>
                
                <div><span className="font-medium text-gray-500">Schedule:</span> {selectedBooking.date} at {selectedBooking.time}</div>
                <div className="col-span-2"><span className="font-medium text-gray-500">Address:</span> {selectedBooking.address}</div>
                
                <div><span className="font-medium text-gray-500">Status:</span> <Badge>{selectedBooking.status}</Badge></div>
                <div><span className="font-medium text-gray-500">Payment:</span> <Badge variant={selectedBooking.paymentStatus === 'FULLY_PAID' ? 'success' : 'outline'}>{selectedBooking.paymentStatus}</Badge></div>
                
                <div><span className="font-medium text-gray-500">Subtotal:</span> ${selectedBooking.subtotal}</div>
                <div><span className="font-medium text-gray-500">Total Price:</span> ${selectedBooking.totalPrice}</div>
                
                <div><span className="font-medium text-gray-500">Paid Amount:</span> ${selectedBooking.paidAmount}</div>
                <div><span className="font-medium text-gray-500">Remaining Amount:</span> ${selectedBooking.remainingAmount}</div>

                <div><span className="font-medium text-gray-500">Platform Commission:</span> ${selectedBooking.platformCommission}</div>
                <div><span className="font-medium text-gray-500">Platform Tax:</span> ${selectedBooking.platformTax}</div>

                {review && (
                  <div className="col-span-2 mt-2 pt-2 border-t flex items-center gap-2">
                    <span className="font-medium text-gray-500">Rating:</span>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-gray-200'}`} />
                      ))}
                      <span className="ml-2 font-medium text-gray-700">{review.rating}/5</span>
                    </div>
                  </div>
                )}
              </div>

              {review?.comment && (
                <div>
                  <span className="font-medium text-gray-500 text-sm">Review Comment:</span>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1 italic">&ldquo;{review.comment}&rdquo;</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <span className="font-medium text-gray-500 text-sm">Notes:</span>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
      <Modal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} title={editingService ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={e => { e.preventDefault(); if (editingService) { updateServiceMutation.mutate(); } else { createServiceMutation.mutate(); } }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Name</label>
            <input required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.categoryId} onChange={e => setServiceForm({ ...serviceForm, categoryId: Number(e.target.value) })}>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.providerId} onChange={e => setServiceForm({ ...serviceForm, providerId: Number(e.target.value) })}>
                {users?.filter(u => u.role === 'PROVIDER').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input type="number" required min="1" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration</label>
              <input required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price Unit</label>
            <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.priceUnit} onChange={e => setServiceForm({ ...serviceForm, priceUnit: e.target.value })}>
              <option value="per hour">Per Hour</option>
              <option value="per job">Per Job</option>
              <option value="per session">Per Session</option>
              <option value="per room">Per Room</option>
              <option value="per project">Per Project</option>
            </select>
          </div>
          <ImageUpload label="Service Image" value={serviceForm.image} onChange={img => setServiceForm({ ...serviceForm, image: img })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowServiceModal(false)}>Cancel</Button>
            <Button type="submit" loading={createServiceMutation.isPending || updateServiceMutation.isPending}>
              {editingService ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateUser.mutate({
                id: editUser.id,
                data: {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  role: formData.get('role') as any,
                  preferredLanguage: formData.get('preferredLanguage') as string,
                  isVerified: formData.get('isVerified') === 'true',
                },
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input name="name" defaultValue={editUser.name} required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" defaultValue={editUser.email} required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input name="phone" defaultValue={editUser.phone} required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" defaultValue={editUser.role} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="CUSTOMER">Customer</option>
                  <option value="PROVIDER">Provider</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select name="preferredLanguage" defaultValue={editUser.preferredLanguage} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="isVerified" defaultValue={editUser.isVerified.toString()} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" loading={updateUser.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
