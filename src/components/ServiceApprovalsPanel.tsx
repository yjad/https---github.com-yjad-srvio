import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { Card, Button, Avatar, Badge, ServiceImage, EmptyState, Modal } from '@/components/shared';
import { useUIStore } from '@/store/uiStore';
import { CheckCircle, XCircle, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import ServiceCommentThread from '@/components/ServiceCommentThread';
import type { Service, User } from '@/types';

interface ServiceApprovalsPanelProps {
  currentUserId: number;
  currentUserRole: 'ADMIN' | 'CUSTOMER_SERVICE';
  currentUserName: string;
}

export default function ServiceApprovalsPanel({ currentUserId, currentUserRole, currentUserName }: ServiceApprovalsPanelProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [expandedThread, setExpandedThread] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<Service | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data: pendingServices, isLoading } = useQuery({
    queryKey: ['pending-services'],
    queryFn: () => mockApi.getPendingServices(),
  });

  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => mockApi.getAllUsers() });

  const approveMutation = useMutation({
    mutationFn: (id: number) => mockApi.updateService(id, { verificationStatus: 'approved', isActive: true }),
    onSuccess: () => {
      addNotification('Service approved and is now live', 'success');
      invalidateAll();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => mockApi.updateService(id, { verificationStatus: 'rejected', isActive: false, rejectionNote: note }),
    onSuccess: (_, vars) => {
      addNotification('Service rejected', 'info');
      const svc = pendingServices?.find(s => s.id === vars.id);
      if (svc) {
        const provider = users?.find(u => u.id === svc.providerId);
        if (provider) mockApi.sendRejectionEmail(provider.email, svc.name, vars.note);
      }
      invalidateAll();
      setRejectModal(null);
      setRejectNote('');
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['pending-services'] });
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    queryClient.invalidateQueries({ queryKey: ['admin-all-services'] });
  }

  async function handleApprove(service: Service) {
    await mockApi.addServiceComment({
      serviceId: service.id, fromId: currentUserId, fromName: currentUserName, fromRole: currentUserRole,
      message: `Service has been approved by ${currentUserName}.`,
    });
    approveMutation.mutate(service.id);
  }

  async function handleReject() {
    if (!rejectModal || rejectNote.trim().length < 10) return;
    await mockApi.addServiceComment({
      serviceId: rejectModal.id, fromId: currentUserId, fromName: currentUserName, fromRole: currentUserRole,
      message: `Service rejected.\nReason: ${rejectNote}`,
    });
    rejectMutation.mutate({ id: rejectModal.id, note: rejectNote });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!pendingServices || pendingServices.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-8 h-8" />}
        title="All caught up!"
        description="No pending services to review."
      />
    );
  }

  return (
    <div className="space-y-3">
      {pendingServices.map(service => (
        <Card key={service.id} className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-4">
              <ServiceImage image={service.image} name={service.name} className="w-16 h-16 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <Badge>pending</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{service.providerName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>${service.price} / {service.priceUnit}</span>
                  <span>{service.duration}</span>
                  <span>{new Date(service.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="success" onClick={() => handleApprove(service)} loading={approveMutation.isPending}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => { setRejectModal(service); setRejectNote(''); }}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setExpandedThread(expandedThread === service.id ? null : service.id)}>
                  {expandedThread === service.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <MessageCircle className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          {expandedThread === service.id && (
            <div className="border-t bg-gray-50 p-4">
              <ServiceCommentThread
                serviceId={service.id}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                currentUserName={currentUserName}
                allowAttachments
              />
            </div>
          )}
        </Card>
      ))}

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Service">
        {rejectModal && (
          <form
            onSubmit={e => { e.preventDefault(); handleReject(); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Note <span className="text-danger-600">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Provide a clear reason. The provider will see this and can reply with supporting documents.
              </p>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                rows={4}
                required
                minLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-danger-500 resize-none"
                placeholder="Explain why this service is being rejected..."
              />
              {rejectNote.length > 0 && rejectNote.length < 10 && (
                <p className="text-xs text-danger-600 mt-1">Please provide at least 10 characters</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button type="submit" variant="danger" loading={rejectMutation.isPending} disabled={rejectNote.trim().length < 10}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
