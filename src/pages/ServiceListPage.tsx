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
import type { Service, Category } from '@/types';
import { useTranslation } from 'react-i18next';
import { localizedName, localizedDescription, serviceProviderName } from '@/utils/localize';

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
  const { category, search, priceMin, priceMax, sortBy, setCategory, setSearch, setSortBy, setPriceRange, resetFilters, family, setFamily } = useFilterStore();
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    const familyParam = searchParams.get('family');
    const { family: curFamily, category: curCat, search: curSearch } = useFilterStore.getState();
    if (cat && Number(cat) !== curCat) setCategory(Number(cat));
    if (q && q !== curSearch) setSearch(q);
    if (familyParam && Number(familyParam) !== curFamily) setFamily(Number(familyParam));
  }, [searchParams]);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    if (category) sp.set('category', String(category)); else sp.delete('category');
    if (search) sp.set('search', search); else sp.delete('search');
    if (priceMin) sp.set('priceMin', String(priceMin)); else sp.delete('priceMin');
    if (priceMax) sp.set('priceMax', String(priceMax)); else sp.delete('priceMax');
    if (sortBy !== 'rating') sp.set('sortBy', sortBy); else sp.delete('sortBy');
    if (family) sp.set('family', String(family)); else sp.delete('family');
    navigate(`?${sp.toString()}`, { replace: true });
  }, [category, search, priceMin, priceMax, sortBy, family]);

  const isProvider = user?.role === 'PROVIDER';

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', category, search, priceMin, priceMax, sortBy, family, isProvider ? user?.id : 'all'],
    queryFn: () => mockApi.getServices({
      category, familyId: family, search: search || undefined, priceMin, priceMax, sortBy,
      providerId: isProvider ? user!.id : null,
    }),
    enabled: !isProvider || !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => mockApi.getCategories(),
  });

  const { data: families } = useQuery({
    queryKey: ['service-families'],
    queryFn: () => mockApi.getServiceFamilies(),
  });

  const hasActiveFilters = category || search || priceMin || priceMax || sortBy !== 'rating' || family;

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
        ...serviceForm, providerId: user!.id, providerName: user!.name, providerNameAr: user!.nameAr || '', providerAvatar: '', providerRating: 0,
      });
    },
    onSuccess: () => {
      addNotification(editingServiceId ? 'Service updated — pending verification' : 'Service submitted for review', 'success');
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
            {isProvider ? t('service_list.my_services') : t('service_list.browse')}
          </h1>
          <p className="text-gray-500 mt-1">
            {isProvider ? t('service_list.manage_services') : t('home.hero_subtitle')}
          </p>
        </div>
        {isProvider && (
          <Button variant="primary" onClick={() => { setEditingServiceId(null); setShowServiceModal(true); }}>
            <Plus className="w-4 h-4 mr-1" /> {t('service_list.add_service')}
          </Button>
        )}
      </div>

      {/* Family Pills */}
      {!isProvider && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFamily(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              !family ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {t('service_list.all')}
          </button>
          {families?.map(f => (
            <button
              key={f.id}
              onClick={() => setFamily(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                family === f.id ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              style={family === f.id ? { backgroundColor: f.color } : undefined}
            >
              {localizedName(f)}
            </button>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      {!isProvider && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('service_list.search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" /> {t('service_list.filters')}
              {hasActiveFilters && <span className="w-2 h-2 bg-primary-600 rounded-full" />}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> {t('service_list.filters')}</h3>
                <button onClick={resetFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('service_list.reset_all')}</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('service_list.category')}</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={category || ''}
                    onChange={e => setCategory(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{t('services.all_categories')}</option>
                    {categories
                      ?.filter(c => !family || String(c.familyId) === String(family))
                      .map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {localizedName(cat)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('services.sort_by')}</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="rating">{t('service_list.highestrated')}</option>
                    <option value="price_asc">{t('service_list.price_low_high')}</option>
                    <option value="price_desc">{t('service_list.price_high_low')}</option>
                    <option value="name">{t('service_list.name_az')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('service_list.min_price', { price: priceMin || 0 })}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('service_list.max_price', { price: priceMax || 3000 })}</label>
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
                  {family && families && (
                    <Badge className="flex items-center gap-1 cursor-pointer">
                      {localizedName(families.find(f => String(f.id) === String(family))!)} <X className="w-3 h-3 ml-1" onClick={() => setFamily(null)} />
                    </Badge>
                  )}
                  {category && (
                    <Badge className="flex items-center gap-1 cursor-pointer" >
                      {categories?.find(c => c.id === category)?.icon} {localizedName(categories?.find(c => c.id === category)!)}
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
        <p className="text-sm text-gray-500">{isLoading ? t('service_list.loading') : t('service_list.services_found', { count: services?.length || 0 })}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : services?.map(service => (
            isProvider
              ? <ProviderServiceCard key={service.id} service={service} categories={categories} onEdit={() => { setEditingServiceId(service.id); setServiceForm({ name: service.name, description: service.description, categoryId: service.categoryId, price: service.price, priceUnit: service.priceUnit, duration: service.duration, image: service.image || '' }); setShowServiceModal(true); }} />
              : <ServiceCard key={service.id} service={service} categories={categories} />
          ))
        }
      </div>

      {!isLoading && services?.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('service_list.no_services_found')}</h3>
          <p className="text-gray-500 mb-4">{isProvider ? t('service_list.add_first') : t('service_list.no_services_hint')}</p>
          {isProvider && (
            <Button variant="primary" onClick={() => { setEditingServiceId(null); setShowServiceModal(true); }}>
              <Plus className="w-4 h-4 mr-1" /> {t('service_list.add_service')}
            </Button>
          )}
        </div>
      )}

      {/* Provider: Add/Edit Service Modal */}
      <Modal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} title={editingServiceId ? t('service_list.edit_service') : t('service_list.add_new_service')}>
        <form onSubmit={e => { e.preventDefault(); saveServiceMutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('service_list.service_name')}</label>
            <input required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('service_list.description')}</label>
            <textarea required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('service_list.category')}</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.categoryId} onChange={e => setServiceForm({ ...serviceForm, categoryId: Number(e.target.value) })}>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.icon} {localizedName(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('service_list.duration')}</label>
              <input required className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('service_list.price')}</label>
              <input type="number" required min="1" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('service_list.price_unit')}</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" value={serviceForm.priceUnit} onChange={e => setServiceForm({ ...serviceForm, priceUnit: e.target.value })}>
                <option value="per hour">{t('service_list.per_hour')}</option>
                <option value="per job">{t('service_list.per_job')}</option>
                <option value="per session">{t('service_list.per_session')}</option>
                <option value="per room">{t('service_list.per_room')}</option>
                <option value="per project">{t('service_list.per_project')}</option>
              </select>
            </div>
          </div>
          <ImageUpload label={t('service_list.service_image')} value={serviceForm.image} onChange={img => setServiceForm({ ...serviceForm, image: img })} />
          {editingServiceId && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-sm text-warning-700" dangerouslySetInnerHTML={{ __html: t('service_list.pending_verification') }} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowServiceModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saveServiceMutation.isPending}>{editingServiceId ? t('service_list.save_changes') : t('service_list.create_service')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ServiceCard({ service, categories }: { service: Service; categories?: Category[] }) {
  const cat = categories?.find(c => c.id === service.categoryId);
  const icon = cat?.icon || '🔧';
  const { t } = useTranslation();

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="group hover:shadow-lg transition-all hover:-translate-y-0.5">
        <div className="relative">
          <ServiceImage
            image={service.image}
            name={service.name}
            fallback={
              <div className="h-44 flex items-center justify-center" style={{ backgroundColor: cat?.color || '#6b7280' }}>
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
              </div>
            }
            className="h-44 w-full"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <span className="text-sm font-bold text-gray-900">{service.price}</span>
            <span className="text-xs text-gray-500">/{service.priceUnit.split(' ')[0]}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{localizedName(service)}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{localizedDescription(service)}</p>
          <div className="flex items-center gap-2 mb-2">
            <Avatar name={serviceProviderName(service)} size="sm" />
            <span className="text-sm text-gray-600">{serviceProviderName(service)}</span>
          </div>
          <div className="flex items-center justify-between">
            <StarRating rating={service.rating} />
            <span className="text-xs text-gray-400">{service.reviewCount} {t('service_list.reviews')}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ProviderServiceCard({ service, onEdit, categories }: { service: Service; onEdit: () => void; categories?: Category[] }) {
  const cat = categories?.find(c => c.id === service.categoryId);
  const icon = cat?.icon || '🔧';
  const { t } = useTranslation();

  return (
    <Card className="group hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer" onClick={onEdit}>
      <div className="relative">
        <ServiceImage
          image={service.image}
          name={service.name}
          fallback={
            <div className="h-44 flex items-center justify-center" style={{ backgroundColor: cat?.color || '#6b7280' }}>
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
            <span className="bg-warning-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">{t('service_list.pending')}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{localizedName(service)}</h3>
          <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
        </div>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{localizedDescription(service)}</p>
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={serviceProviderName(service)} size="sm" />
          <span className="text-sm text-gray-600">{serviceProviderName(service)}</span>
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
