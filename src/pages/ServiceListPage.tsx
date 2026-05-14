import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useFilterStore } from '@/store/filterStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card, Avatar, StarRating, Skeleton, Badge, ServiceImage, Button, ImageUpload, Modal } from '@/components/shared';
import { cn } from '@/utils/cn';
import { Search, SlidersHorizontal, X, Clock, Filter, Plus, Edit2 } from 'lucide-react';
import type { Service } from '@/types';

const categoryGradients: Record<number, string> = {
  1: 'from-blue-400 to-blue-600',
  2: 'from-green-400 to-green-600',
  3: 'from-amber-400 to-amber-600',
  4: 'from-purple-400 to-purple-600',
  5: 'from-pink-400 to-pink-600',
  6: 'from-teal-400 to-teal-600',
};

const categoryIcons = ['🔧', '🧹', '⚡', '🛠️', '🎨', '🌿'];

const verificationBadge: Record<string, string> = {
  approved: 'bg-accent-100 text-accent-700',
  pending: 'bg-warning-100 text-warning-600',
  rejected: 'bg-danger-100 text-danger-700',
};

export default function ServiceListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();
  const { category, search, priceMin, priceMax, sortBy, setCategory, setSearch, setSortBy, resetFilters } = useFilterStore();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    if (cat) setCategory(Number(cat));
    if (q) setSearch(q);
  }, [searchParams]);

  const isProvider = user?.role === 'PROVIDER';

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', category, search, priceMin, priceMax, sortBy, isProvider ? user?.id : 'all'],
    queryFn: () => mockApi.getServices({
      category, search: search || undefined, priceMin, priceMax, sortBy,
      providerId: isProvider ? user!.id : null,
    }),
    enabled: !isProvider || !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => mockApi.getCategories(),
  });

  const hasActiveFilters = category || search || priceMin || priceMax || sortBy !== 'rating';

  // ── Provider: Add/Edit Service Modal ──
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '' });

  const saveServiceMutation = useMutation({
    mutationFn: async () => {
      if (editingServiceId) {
        const data = { ...serviceForm, verificationStatus: 'pending' as const };
        return mockApi.updateService(editingServiceId, data);
      }
      return mockApi.createService({
        ...serviceForm, providerId: user!.id, providerName: user!.name, providerAvatar: '', providerRating: 0,
      });
    },
    onSuccess: () => {
      addNotification(editingServiceId ? 'Service updated — pending verification' : 'Service created!', 'success');
      setShowServiceModal(false);
      setEditingServiceId(null);
      setServiceForm({ name: '', description: '', categoryId: 1, price: 0, priceUnit: 'per hour', duration: '1 hour', image: '' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: Error) => {
      addNotification(`Save failed: ${err.message}`, 'error');
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isProvider ? 'My Services' : 'Browse Services'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isProvider ? 'Manage your services' : 'Find the perfect service provider for your needs'}
          </p>
        </div>
        {isProvider && (
          <Button variant="primary" onClick={() => { setEditingServiceId(null); setShowServiceModal(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Service
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      {!isProvider && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search services, providers..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" /> Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-primary-600 rounded-full" />}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
                <button onClick={resetFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Reset All</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={category || ''}
                    onChange={e => setCategory(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">All Categories</option>
                    {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort By</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Price: ${priceMin || 0}</label>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="10"
                    value={priceMin || 0}
                    onChange={e => useFilterStore.getState().setPriceRange(Number(e.target.value), priceMax)}
                    className="w-full accent-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Price: ${priceMax || 3000}</label>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="10"
                    value={priceMax || 3000}
                    onChange={e => useFilterStore.getState().setPriceRange(priceMin, Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {category && (
                    <Badge className="flex items-center gap-1 cursor-pointer" >
                      {categories?.find(c => c.id === category)?.icon} {categories?.find(c => c.id === category)?.name}
                      <X className="w-3 h-3 ml-1" onClick={() => setCategory(null)} />
                    </Badge>
                  )}
                  {search && (
                    <Badge className="flex items-center gap-1 cursor-pointer">
                      &ldquo;{search}&rdquo; <X className="w-3 h-3 ml-1" onClick={() => setSearch('')} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{isLoading ? 'Loading...' : `${services?.length || 0} services found`}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : services?.map(service => (
            isProvider
              ? <ProviderServiceCard key={service.id} service={service} onEdit={() => { setEditingServiceId(service.id); setServiceForm({ name: service.name, description: service.description, categoryId: service.categoryId, price: service.price, priceUnit: service.priceUnit, duration: service.duration, image: service.image || '' }); setShowServiceModal(true); }} />
              : <ServiceCard key={service.id} service={service} />
          ))
        }
      </div>

      {!isLoading && services?.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No services found</h3>
          <p className="text-gray-500 mb-4">{isProvider ? 'Add your first service to get started.' : 'Try adjusting your filters or search terms'}</p>
          {isProvider && (
            <Button variant="primary" onClick={() => { setEditingServiceId(null); setShowServiceModal(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Service
            </Button>
          )}
        </div>
      )}

      {/* Provider: Add/Edit Service Modal */}
      <Modal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} title={editingServiceId ? 'Edit Service' : 'Add New Service'}>
        <form onSubmit={e => { e.preventDefault(); saveServiceMutation.mutate(); }} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700">Duration</label>
              <input required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input type="number" required min="1" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
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
          </div>
          <ImageUpload label="Service Image" value={serviceForm.image} onChange={img => setServiceForm({ ...serviceForm, image: img })} />
          {editingServiceId && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-sm text-warning-700">
              After saving, this service will be set to <strong>pending verification</strong> until a Customer Service agent approves the changes.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowServiceModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveServiceMutation.isPending}>{editingServiceId ? 'Save Changes' : 'Create Service'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const gradient = categoryGradients[service.categoryId] || 'from-gray-400 to-gray-500';
  const icon = categoryIcons[service.categoryId - 1] || '🔧';

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="group hover:shadow-lg transition-all hover:-translate-y-0.5">
        <div className="relative">
          <ServiceImage
            image={service.image}
            name={service.name}
            fallback={
              <div className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
              </div>
            }
            className="h-44 w-full"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <span className="text-sm font-bold text-gray-900">${service.price}</span>
            <span className="text-xs text-gray-500">/{service.priceUnit.split(' ')[0]}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{service.name}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <Avatar name={service.providerName} size="sm" />
            <span className="text-sm text-gray-600">{service.providerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <StarRating rating={service.rating} />
            <span className="text-xs text-gray-400">{service.reviewCount} reviews</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ProviderServiceCard({ service, onEdit }: { service: Service; onEdit: () => void }) {
  const gradient = categoryGradients[service.categoryId] || 'from-gray-400 to-gray-500';
  const icon = categoryIcons[service.categoryId - 1] || '🔧';

  return (
    <Card className="group hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer" onClick={onEdit}>
      <div className="relative">
        <ServiceImage
          image={service.image}
          name={service.name}
          fallback={
            <div className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
            </div>
          }
          className="h-44 w-full"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          <span className="text-sm font-bold text-gray-900">${service.price}</span>
          <span className="text-xs text-gray-500">/{service.priceUnit.split(' ')[0]}</span>
        </div>
        {service.verificationStatus === 'pending' && (
          <div className="absolute top-3 left-3">
            <span className="bg-warning-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">Pending</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{service.name}</h3>
          <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
        </div>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={service.providerName} size="sm" />
          <span className="text-sm text-gray-600">{service.providerName}</span>
        </div>
        <div className="flex items-center justify-between">
          <StarRating rating={service.rating} />
          {service.verificationStatus && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', verificationBadge[service.verificationStatus])}>
              {service.verificationStatus}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration}</span>
        </div>
      </div>
    </Card>
  );
}

function ServiceCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  );
}
