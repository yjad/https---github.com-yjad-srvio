import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { Card, Badge, Avatar, PageHeader, Skeleton } from '@/components/shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, Package, TrendingUp } from 'lucide-react';

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['customer-stats', user?.id],
    queryFn: () => mockApi.getCustomerStats(user!.id),
    enabled: !!user,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', user?.id, 'CUSTOMER'],
    queryFn: () => mockApi.getBookings({ userId: user!.id, role: 'CUSTOMER' }),
    enabled: !!user,
  });

  if (!user) return null;

  if (statsLoading || bookingsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader 
        title="My Dashboard" 
        subtitle={`Welcome back, ${user.name}. Here's what's happening with your services.`} 
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-primary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-accent-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats?.totalSpent || 0}</p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-warning-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center text-warning-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingBookings || 0}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedBookings || 0}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Spending Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" /> Spending Overview
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: unknown) => [`$${value}`, 'Spending'] as [string, string]}
                />
                <Bar dataKey="amount" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" /> Recent Bookings
          </h3>
          <div className="space-y-4">
            {bookings && bookings.length > 0 ? (
              bookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Avatar name={booking.providerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{booking.serviceName}</p>
                    <p className="text-xs text-gray-500 mb-1">{booking.providerName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {booking.date}</span>
                      <Badge className="scale-75 origin-left">{booking.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">${booking.totalPrice}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No bookings yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
