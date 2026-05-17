import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card, Badge, Button, PageHeader, Skeleton, EmptyState, Modal, Select, Input, Textarea, DisputeStatusBadge } from '@/components/shared';
import { disputeCreateSchema } from '@/schemas';
import { ShieldAlert, Plus, Calendar, FileText, AlertTriangle, Upload, X } from 'lucide-react';

const DISPUTE_CATEGORIES = [
  { value: 'SERVICE_NOT_DELIVERED', label: 'Service Not Delivered' },
  { value: 'POOR_QUALITY', label: 'Poor Quality' },
  { value: 'WRONG_PRICE', label: 'Wrong Price' },
  { value: 'DAMAGED_PROPERTY', label: 'Damaged Property' },
  { value: 'PROVIDER_NO_SHOW', label: 'Provider No Show' },
  { value: 'CUSTOMER_ABUSE', label: 'Customer Abuse' },
  { value: 'INCOMPLETE_WORK', label: 'Incomplete Work' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'OTHER', label: 'Other' },
];

const RESOLUTION_OPTIONS = [
  { value: 'FULL_REFUND', label: 'Full Refund' },
  { value: 'PARTIAL_REFUND', label: 'Partial Refund' },
  { value: 'REWORK', label: 'Rework' },
  { value: 'PAYMENT_RELEASE', label: 'Payment Release' },
  { value: 'ACCOUNT_REVIEW', label: 'Account Review' },
  { value: 'OTHER', label: 'Other' },
];

export default function DisputesPage() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(searchParams.has('create') ? 'create' : 'list');
  const [createModal, setCreateModal] = useState(searchParams.has('create'));
  const [form, setForm] = useState({ bookingId: 0, disputeCategory: 'SERVICE_NOT_DELIVERED', title: '', description: '', requestedResolution: 'FULL_REFUND' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [createFilePreviews, setCreateFilePreviews] = useState<string[]>([]);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (bookingId) {
      setForm(f => ({ ...f, bookingId: Number(bookingId) }));
      setActiveTab('create');
      setCreateModal(true);
    }
  }, [searchParams]);

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['disputes', user?.id, user?.role],
    queryFn: () => {
      if (!user) return [];
      return mockApi.getDisputes({ userId: user.id, role: user.role });
    },
    enabled: !!user,
  });

  const { data: completedBookings } = useQuery({
    queryKey: ['bookings', user?.id, user?.role, 'completed'],
    queryFn: () => {
      if (!user) return [];
      return mockApi.getBookings({ userId: user.id, role: user.role, providerId: user.id });
    },
    enabled: !!user && activeTab === 'create',
    select: (data) => data?.filter(b => b.status === 'COMPLETED' && !disputes?.some(d => d.bookingId === b.id && d.status !== 'CLOSED')) || [],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!user) throw new Error('Not authenticated');
      const dispute = await mockApi.createDispute({
        bookingId: data.bookingId,
        raisedById: user.id,
        raisedByRole: user.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER',
        disputeCategory: data.disputeCategory as any,
        title: data.title,
        description: data.description,
        requestedResolution: data.requestedResolution as any,
      });
      if (createFiles.length > 0) {
        for (const file of createFiles) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const path = await mockApi.saveImage(dataUrl, 'attachments');
          await mockApi.uploadEvidence(dispute.id, { uploaderId: user.id, fileType: file.type, fileName: file.name, filePath: path });
        }
      }
      return dispute;
    },
    onSuccess: () => {
      addNotification('Dispute created successfully', 'success');
      setCreateModal(false);
      setCreateFiles([]);
      setCreateFilePreviews([]);
      setForm({ bookingId: 0, disputeCategory: 'SERVICE_NOT_DELIVERED', title: '', description: '', requestedResolution: 'FULL_REFUND' });
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: Error) => {
      addNotification(err.message, 'error');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = disputeCreateSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path.join('.');
        if (key) errs[key] = issue.message;
      });
      setErrors(errs);
      return;
    }
    createMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader title="Disputes" subtitle="Raise and track service disputes" />

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['list', 'create'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setErrors({}); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {tab === 'list' ? 'My Disputes' : 'Create Dispute'}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <>
          {!disputes || disputes.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert className="w-8 h-8" />}
              title="No disputes"
              description={user?.role === 'PROVIDER' ? "No disputes involving your services." : "You haven't raised any disputes yet. If you have an issue with a completed booking, you can create a dispute."}
              action={user?.role !== 'PROVIDER' ? <Button variant="primary" onClick={() => setActiveTab('create')}><Plus className="w-4 h-4 mr-1" /> Raise a Dispute</Button> : undefined}
            />
          ) : (
            <div className="space-y-4">
              {disputes.map(dispute => (
                <Link key={dispute.id} to={`/disputes/${dispute.id}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{dispute.title}</h3>
                          <DisputeStatusBadge status={dispute.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(dispute.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><FileText className="w-4 h-4" />Booking #{dispute.bookingId}</span>
                          <span><AlertTriangle className="w-4 h-4 inline mr-1" />{dispute.disputeCategory.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-gray-900">${dispute.holdAmount}</p>
                        <p className="text-xs text-gray-500">on hold</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'create' && (
        <Card className="p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <Select
              label="Booking"
              error={errors.bookingId}
              options={(completedBookings || []).map(b => ({ value: b.id, label: `#${b.id} - ${b.serviceName} (${b.date})` }))}
              value={form.bookingId}
              onChange={e => setForm({ ...form, bookingId: Number(e.target.value) })}
            />
            <Select
              label="Category"
              error={errors.disputeCategory}
              options={DISPUTE_CATEGORIES}
              value={form.disputeCategory}
              onChange={e => setForm({ ...form, disputeCategory: e.target.value })}
            />
            <Input
              label="Title"
              error={errors.title}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Brief title for your dispute"
            />
            <Textarea
              label="Description"
              error={errors.description}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue in detail"
              rows={4}
            />
            <Select
              label="Requested Resolution"
              error={errors.requestedResolution}
              options={RESOLUTION_OPTIONS}
              value={form.requestedResolution}
              onChange={e => setForm({ ...form, requestedResolution: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Photos (optional)</label>
              <div className="flex items-center gap-3">
                <input
                  ref={createFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setCreateFiles(prev => [...prev, ...files]);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = () => setCreateFilePreviews(prev => [...prev, reader.result as string]);
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }}
                />
                <Button variant="outline" type="button" onClick={() => createFileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Select Photos
                </Button>
              </div>
              {createFilePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {createFilePreviews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <img src={preview} alt={`Preview ${i}`} className="w-16 h-16 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => {
                          setCreateFiles(prev => prev.filter((_, j) => j !== i));
                          setCreateFilePreviews(prev => prev.filter((_, j) => j !== i));
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={createMutation.isPending}>
              Submit Dispute
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
