import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { Card, PageHeader, Skeleton, DisputeStatusBadge, DataTable, Column } from '@/components/shared';
import { ShieldAlert, AlertCircle, Scale } from 'lucide-react';
import type { Dispute } from '@/types';

export default function CSDisputesPage() {
  const navigate = useNavigate();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['cs-disputes'],
    queryFn: () => mockApi.getAllDisputes(),
  });

  const { data: stats } = useQuery({
    queryKey: ['cs-dispute-stats'],
    queryFn: () => mockApi.getCSDisputeStats(),
  });

  const columns: Column<Dispute>[] = [
    { header: 'ID', accessor: 'id', sortable: true, className: 'w-16' },
    { header: 'Title', accessor: 'title', sortable: true, searchable: true },
    {
      header: 'Category',
      accessor: (row) => row.disputeCategory.replace(/_/g, ' '),
      sortKey: 'disputeCategory',
      sortable: true,
      className: 'capitalize',
    },
    {
      header: 'Status',
      accessor: (row) => <DisputeStatusBadge status={row.status} />,
      sortKey: 'status',
      sortable: true,
    },
    { header: 'Booking', accessor: 'bookingId', sortable: true, className: 'w-20' },
    {
      header: 'Raised By',
      accessor: (row) => `${row.raisedByRole} #${row.raisedById}`,
      sortKey: 'raisedByRole',
      sortable: true,
    },
    { header: 'Hold', accessor: 'holdAmount', sortable: true, className: 'w-24', sortKey: 'holdAmount' },
    {
      header: 'Created',
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortKey: 'createdAt',
      sortable: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader title="Dispute Management" subtitle="Review and manage all platform disputes" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.open || 0}</p>
              <p className="text-xs text-gray-500 font-medium">Open</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-warning-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center text-warning-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.underReview || 0}</p>
              <p className="text-xs text-gray-500 font-medium">Under Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.escalated || 0}</p>
              <p className="text-xs text-gray-500 font-medium">Escalated</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-accent-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.resolved || 0}</p>
              <p className="text-xs text-gray-500 font-medium">Resolved</p>
            </div>
          </div>
        </Card>
      </div>

      <DataTable<Dispute>
        columns={columns}
        data={disputes || []}
        searchPlaceholder="Search disputes..."
        onRowClick={(row) => navigate(`/disputes/${row.id}`)}
        emptyState={
          <div className="flex flex-col items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-gray-300" />
            <p>No disputes found</p>
          </div>
        }
      />
    </div>
  );
}
