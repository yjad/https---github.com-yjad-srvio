import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { mockApi } from '@/api/mockApi';
import { Card, Badge, Avatar, StarRating, PageHeader, ServiceImage, EmptyState, Skeleton } from '@/components/shared';
import { Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { localizedName, localizedDescription, serviceProviderName } from '@/utils/localize';
import { useTranslation } from 'react-i18next';

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ['provider-profile', id],
    queryFn: async () => {
      const users = await mockApi.getAllUsers();
      return users.find(u => u.id === Number(id)) || null;
    },
    enabled: !!id,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['provider-services', id],
    queryFn: () => mockApi.getServices({ providerId: Number(id) }),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['provider-reviews', id],
    queryFn: () => mockApi.getReviews(Number(id)),
    enabled: !!id,
  });

  if (providerLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <EmptyState icon={<ArrowLeft className="w-8 h-8" />} title={t('provider_profile.not_found')} description={t('provider_profile.not_found_desc')} />
      </div>
    );
  }

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : provider.isVerified ? 5.0 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <Link to="/services" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium mb-2">
        <ArrowLeft className="w-4 h-4" /> {t('provider_profile.back_to_services')}
      </Link>

      {/* Provider Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar name={localizedName(provider)} size="lg" src={provider.avatar} />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{localizedName(provider)}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <StarRating rating={avgRating} />
              <span className="text-sm text-gray-500">({reviews?.length || 0} {t('provider_profile.reviews')})</span>
            </div>
            {provider.isVerified && (
              <Badge className="mt-2 bg-accent-100 text-accent-700">{t('provider_profile.verified')}</Badge>
            )}
            {provider.bio && (
              <p className="text-sm text-gray-600 mt-3">{i18n.language === 'ar' && provider.bioAr ? provider.bioAr : provider.bio}</p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('provider_profile.member_since')} {new Date(provider.joinDate).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Services */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('provider_profile.services')} ({services?.length || 0})</h2>
        {servicesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : services && services.length > 0 ? (
          <div className="space-y-4">
            {services.filter(s => s.isActive !== false).map(svc => (
              <Link key={svc.id} to={`/services/${svc.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex gap-4">
                    <ServiceImage image={svc.image} name={localizedName(svc)} className="w-20 h-20 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{localizedName(svc)}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{localizedDescription(svc)}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="font-bold text-gray-900">{svc.price} <span className="text-sm font-normal text-gray-500">/ {t(`provider.${svc.priceUnit.replace(/\s/g, '_')}` as any) || svc.priceUnit}</span></span>
                        <StarRating rating={svc.rating} size="sm" />
                        <span className="text-sm text-gray-400">{svc.duration}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-gray-500">{t('provider_profile.no_services')}</Card>
        )}
      </div>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('provider_profile.reviews')} ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.slice(0, 10).map(review => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={review.customerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{review.customerName}</span>
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-400 ml-auto">{new Date(review.createdAt).toLocaleDateString(locale)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
