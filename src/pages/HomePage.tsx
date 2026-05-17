import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { mockApi } from '@/api/mockApi';
import { useQuery } from '@tanstack/react-query';
import { Card, Avatar, StarRating, Skeleton, ServiceImage } from '@/components/shared';
import { Search, ArrowRight, Star, Shield, Clock, CheckCircle, Users, Briefcase, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useState } from 'react';

export default function HomePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);

  const { data: families } = useQuery({
    queryKey: ['service-families'],
    queryFn: () => mockApi.getServiceFamilies(),
  });

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => mockApi.getCategories(),
  });

  const filteredCategories = selectedFamily
    ? categories?.filter(c => String(c.familyId) === String(selectedFamily)) || []
    : categories?.filter(c => families?.some(f => String(f.id) === String(c.familyId))) || [];

  const { data: services, isLoading: svcLoading } = useQuery({
    queryKey: ['services', 'home'],
    queryFn: () => mockApi.getServices({ sortBy: 'rating' }),
  });

  const topServices = services?.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" /> Trusted by 10,000+ homeowners
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find Trusted Local
              <span className="block text-accent-400">Service Providers</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Book reliable plumbers, cleaners, electricians and more in minutes. Quality service, transparent pricing, guaranteed satisfaction.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  className="flex-1 pl-12 pr-4 py-4 text-gray-900 text-sm focus:outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      window.location.href = `/services?search=${encodeURIComponent(searchTerm)}`;
                    }
                  }}
                />
                <Link to="/services" className="bg-primary-600 hover:bg-primary-700 px-6 py-4 font-medium text-sm transition-colors shrink-0">
                  Search
                </Link>
              </div>
            </div>

            {authLoading ? (
              <div className="mt-6 h-12" />
            ) : !isAuthenticated ? (
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl font-medium transition-colors">
                  Sign In
                </Link>
              </div>
            ) : user && (
              <p className="mt-4 text-primary-200">Welcome back, {user.name}!</p>
            )}
          </div>
        </div>
      </section>

      {/* Family Tab Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex flex-wrap gap-2">
          {families?.map(family => (
            <button
              key={family.id}
              onClick={() => setSelectedFamily(selectedFamily === family.id ? null : family.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                selectedFamily === family.id
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              style={selectedFamily === family.id ? { backgroundColor: family.color } : undefined}
            >
              {family.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Verified Providers', value: '500+' },
            { icon: Briefcase, label: 'Services Available', value: '50+' },
            { icon: CheckCircle, label: 'Completed Jobs', value: '10K+' },
            { icon: Star, label: 'Average Rating', value: '4.8' },
          ].map((stat, i) => (
            <Card key={i} className="p-4 text-center">
              <stat.icon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse by Category</h2>
          <p className="text-gray-500">Find the perfect service for your needs</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {catLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
            : filteredCategories?.map(cat => {
                const fam = families?.find(f => String(f.id) === String(cat.familyId));
                const gradient = fam ? fam.color : '#6b7280';
                return (
                  <Link key={cat.id} to={`/services?category=${cat.id}`}>
                    <Card className="p-4 text-center hover:shadow-md transition-all hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: `linear-gradient(135deg, ${gradient}, ${gradient}dd)` }}>
                        {cat.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{cat.serviceCount} services</p>
                    </Card>
                  </Link>
                );
              })
          }
          {!catLoading && filteredCategories.length === 0 && (
            <p className="text-gray-400 text-center py-8 col-span-full">No categories in this family yet.</p>
          )}
        </div>
      </section>

      {/* Top Services */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Top Rated Services</h2>
              <p className="text-gray-500">Most popular services loved by our customers</p>
            </div>
            <Link to="/services" className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {svcLoading
              ? Array.from({ length: 3 }).map((_, i) => <ServiceSkeleton key={i} />)
              : topServices.map(service => <ServiceCard key={service.id} service={service} />)
            }
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link to="/services" className="inline-flex items-center gap-1 text-primary-600 font-medium">
              View All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-500">Book a service in 3 simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', icon: Search, title: 'Find a Service', desc: 'Browse our curated list of verified service providers. Filter by category, price, or rating.' },
            { step: '2', icon: Clock, title: 'Book & Schedule', desc: 'Choose your preferred date and time. Get instant confirmation and track your booking.' },
            { step: '3', icon: Shield, title: 'Service Delivered', desc: 'Our provider arrives on time. Pay securely and leave a review to help others.' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="relative inline-flex mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-primary-600" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Are You a Service Provider?</h2>
          <p className="text-primary-100 mb-8 text-lg">Join our platform and connect with thousands of customers. Set your own schedule and grow your business.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
            Become a Provider <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><span className="text-white">⚡</span></div>
                <span className="text-lg font-bold text-white">srvio</span>
              </div>
              <p className="text-sm">Connecting you with trusted local service providers since 2024.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/services?category=1" className="hover:text-white transition-colors">Plumbing</Link></li>
                <li><Link to="/services?category=2" className="hover:text-white transition-colors">Cleaning</Link></li>
                <li><Link to="/services?category=3" className="hover:text-white transition-colors">Electrical</Link></li>
                <li><Link to="/services?category=4" className="hover:text-white transition-colors">Handyman</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2025 srvio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ service }: { service: { id: number; name: string; description: string; providerName: string; price: number; priceUnit: string; rating: number; reviewCount: number; duration: string; categoryId: number; image?: string | null } }) {
  const gradients = ['from-blue-400 to-blue-600', 'from-green-400 to-green-600', 'from-amber-400 to-amber-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600', 'from-teal-400 to-teal-600'];
  const gradient = gradients[service.categoryId % gradients.length];
  const icons = ['🔧', '🧹', '⚡', '🛠️', '🎨', '🌿'];
  const icon = icons[service.categoryId - 1] || '🔧';

  return (
    <Card className="group hover:shadow-lg transition-all" onClick={() => window.location.href = `/services/${service.id}`}>
      <div className="h-40 relative overflow-hidden">
        <ServiceImage image={service.image} name={service.name}
          fallback={
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
            </div>
          }
          className="h-full w-full" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
          <span className="text-sm font-bold text-gray-900">${service.price}</span>
          <span className="text-xs text-gray-500">/{service.priceUnit.split(' ')[0]}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{service.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={service.providerName} size="sm" />
          <span className="text-sm text-gray-600">{service.providerName}</span>
        </div>
        <div className="flex items-center justify-between">
          <StarRating rating={service.rating} />
          <span className="text-xs text-gray-400">{service.reviewCount} reviews</span>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" /> {service.duration}
        </div>
      </div>
    </Card>
  );
}

function ServiceSkeleton() {
  return (
    <Card className="animate-pulse">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  );
}
