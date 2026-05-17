import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { Card, Badge, Avatar, PageHeader, Skeleton, Button } from '@/components/shared';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Calendar, Clock, CheckCircle, Package, 
  MessageSquare, Users, AlertCircle, LifeBuoy, ShieldAlert
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ServiceApprovalsPanel from '@/components/ServiceApprovalsPanel';

export default function CustomerServiceDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'disputes'>('overview');

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'CUSTOMER_SERVICE'],
    queryFn: () => mockApi.getBookings({ role: 'CUSTOMER_SERVICE' }),
    enabled: !!user,
  });

  const { data: pendingServices } = useQuery({
    queryKey: ['pending-services'],
    queryFn: () => mockApi.getPendingServices(),
  });
  const pendingCount = pendingServices?.length || 0;

  const { data: disputeStats } = useQuery({
    queryKey: ['cs-dispute-stats'],
    queryFn: () => mockApi.getCSDisputeStats(),
  });

  if (!user) return null;

  if (bookingsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'REQUESTED').length || 0;
  const activeBookings = bookings?.filter(b => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'COMPLETED').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader 
        title="Support Dashboard" 
        subtitle={`Welcome, ${user.name}.`}
        action={
          <Link to="/bookings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> View All Bookings
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['overview', 'approvals', 'disputes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'approvals' ? `Pending Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}` : tab === 'disputes' ? `Disputes${disputeStats ? ` (${disputeStats.open})` : ''}` : 'Overview'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border-l-4 border-primary-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                  <p className="text-xs text-gray-500 font-medium">Total platform bookings</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 border-l-4 border-warning-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center text-warning-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
                  <p className="text-xs text-gray-500 font-medium">Pending approvals</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeBookings}</p>
                  <p className="text-xs text-gray-500 font-medium">Active jobs</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-accent-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
                  <p className="text-xs text-gray-500 font-medium">Completed successfully</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/customer-service/disputes')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{disputeStats ? disputeStats.open + disputeStats.escalated : 0}</p>
                  <p className="text-xs text-gray-500 font-medium">Open disputes</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" /> Recent Platform Activity
                </h3>
              </div>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Booking ID</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Service</th>
                      <th className="px-6 py-3">Provider</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings?.slice(0, 8).map(booking => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{booking.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={booking.customerName} size="xs" />
                            <span className="text-sm text-gray-700">{booking.customerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.serviceName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.providerName}</td>
                        <td className="px-6 py-4">
                          <Badge className="scale-90 origin-left">{booking.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{booking.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 bg-primary-600 text-white border-none shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <LifeBuoy className="w-5 h-5 text-white/80" /> Need Assistance?
                  </h3>
                  <p className="text-sm text-white/80 mb-4">
                    Access advanced admin tools or contact technical support for database issues.
                  </p>
                  <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    Open Support Ticket
                  </Button>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" /> Platform Overview
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Service Categories</span>
                    <span className="text-sm font-bold text-gray-900">6 Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Providers</span>
                    <span className="text-sm font-bold text-gray-900">12 Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avg. Response Time</span>
                    <span className="text-sm font-bold text-accent-600">1.2 hrs</span>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full text-xs" size="sm">
                      Download Reports
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Pending Approvals */}
      {activeTab === 'approvals' && (
        <div className="animate-fade-in">
          <ServiceApprovalsPanel currentUserId={user.id} currentUserRole="CUSTOMER_SERVICE" currentUserName={user.name} />
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="animate-fade-in text-center py-12">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispute Management</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">View and manage all platform disputes</p>
          <Button variant="primary" onClick={() => navigate('/customer-service/disputes')}>
            Open Disputes Panel
          </Button>
        </div>
      )}
    </div>
  );
}
