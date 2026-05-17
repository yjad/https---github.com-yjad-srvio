import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Card, Button, PageHeader, Skeleton, Badge, Avatar, Modal, Select, Textarea, DisputeStatusBadge, DisputeTimeline } from '@/components/shared';
import { ShieldAlert, MessageCircle, Paperclip, Send, Upload, Eye, ArrowLeft, Trash2 } from 'lucide-react';
import type { UserRole } from '@/types';

type TabType = 'overview' | 'messages' | 'evidence' | 'timeline';

const TABS: { key: TabType; label: string; icon: typeof ShieldAlert }[] = [
  { key: 'overview', label: 'Overview', icon: ShieldAlert },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
  { key: 'evidence', label: 'Evidence', icon: Paperclip },
  { key: 'timeline', label: 'Timeline', icon: Eye },
];

const CS_ACTIONS = [
  { value: 'REQUEST_MORE_INFO', label: 'Request More Info' },
  { value: 'ESCALATE', label: 'Escalate' },
  { value: 'APPROVE_REFUND', label: 'Approve Refund' },
  { value: 'PARTIAL_SETTLEMENT', label: 'Partial Settlement' },
  { value: 'RELEASE_ESCROW', label: 'Release Escrow' },
  { value: 'REJECT_DISPUTE', label: 'Reject Dispute' },
  { value: 'CLOSE_CASE', label: 'Close Case' },
];

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();
  const disputeId = Number(id);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [newMessage, setNewMessage] = useState('');
  const [csActionOpen, setCsActionOpen] = useState(false);
  const [csAction, setCsAction] = useState('');
  const [csComment, setCsComment] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCS = user?.role === 'CUSTOMER_SERVICE' || user?.role === 'ADMIN';
  const canViewInternal = isCS;

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => mockApi.getDisputeById(disputeId),
    enabled: !!disputeId,
  });

  const isRaiser = user?.id === dispute?.raisedById;

  const { data: raiserUser } = useQuery({
    queryKey: ['user', dispute?.raisedById],
    queryFn: () => mockApi.getUserById(dispute!.raisedById),
    enabled: !!dispute?.raisedById,
  });

  const { data: messages } = useQuery({
    queryKey: ['dispute-messages', disputeId],
    queryFn: () => mockApi.getDisputeMessages(disputeId),
    enabled: !!disputeId,
  });

  const uniqueSenderIds = [...new Set((messages || []).map(m => m.fromId))];
  const { data: senders } = useQuery({
    queryKey: ['users-batch', uniqueSenderIds],
    queryFn: async () => {
      const results = await Promise.all(uniqueSenderIds.map(id => mockApi.getUserById(id)));
      const map: Record<number, string> = {};
      results.forEach(u => { if (u) map[u.id] = u.name; });
      return map;
    },
    enabled: uniqueSenderIds.length > 0,
  });

  const { data: evidence } = useQuery({
    queryKey: ['dispute-evidence', disputeId],
    queryFn: () => mockApi.getDisputeEvidence(disputeId),
    enabled: !!disputeId,
  });

  const { data: timeline } = useQuery({
    queryKey: ['dispute-timeline', disputeId],
    queryFn: () => mockApi.getDisputeTimeline(disputeId),
    enabled: !!disputeId,
  });

  useEffect(() => {
    if (!dispute || dispute.status !== 'MEDIATION' || !isCS) return;
    mockApi.checkMediationTimeouts().then(() => {
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    });
  }, [dispute?.status]);

  // Evidence image resolution
  const [resolvedEvidence, setResolvedEvidence] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!evidence) return;
    evidence.forEach(async (ev) => {
      const blob = await mockApi.getImageBlob(ev.filePath);
      if (blob) setResolvedEvidence(prev => ({ ...prev, [ev.id]: blob }));
    });
  }, [evidence]);

  const messageMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return mockApi.addDisputeMessage(disputeId, {
        fromId: user.id,
        fromRole: user.role as UserRole,
        message: newMessage,
      });
    },
    onSuccess: () => {
      setNewMessage('');
      addNotification('Message sent', 'success');
      queryClient.invalidateQueries({ queryKey: ['dispute-messages', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['dispute-timeline', disputeId] });
    },
    onError: (err: Error) => addNotification(err.message, 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => mockApi.updateDisputeStatus(disputeId, status as any),
    onSuccess: () => {
      addNotification('Dispute status updated', 'success');
      setCsActionOpen(false);
      setCsAction('');
      setCsComment('');
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['dispute-timeline', disputeId] });
    },
    onError: (err: Error) => addNotification(err.message, 'error'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ type, comment }: { type: string; comment: string }) => {
      if (!user) throw new Error('Not authenticated');
      return mockApi.resolveDispute(disputeId, { type, csComment: comment, actorId: user.id, financialSummary: comment });
    },
    onSuccess: () => {
      addNotification('Dispute resolved', 'success');
      setCsActionOpen(false);
      setCsAction('');
      setCsComment('');
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['dispute-timeline', disputeId] });
    },
    onError: (err: Error) => addNotification(err.message, 'error'),
  });

  const evidenceMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const path = await mockApi.saveImage(dataUrl, 'attachments');
      return mockApi.uploadEvidence(disputeId, { uploaderId: user.id, fileType: file.type, fileName: file.name, filePath: path });
    },
    onSuccess: () => {
      addNotification('Evidence uploaded', 'success');
      setEvidenceFiles(null);
      setEvidencePreviews([]);
      queryClient.invalidateQueries({ queryKey: ['dispute-evidence', disputeId] });
    },
    onError: (err: Error) => addNotification(err.message, 'error'),
  });

  const deleteEvidenceMutation = useMutation({
    mutationFn: ({ id, filePath }: { id: number; filePath: string }) =>
      mockApi.deleteDisputeEvidence(id, filePath),
    onSuccess: () => {
      addNotification('Evidence removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['dispute-evidence', disputeId] });
    },
    onError: (err: Error) => addNotification(err.message, 'error'),
  });

  const handleCsAction = () => {
    if (!csAction || !csComment) {
      addNotification('Please select an action and provide a comment', 'error');
      return;
    }
    if (csAction === 'APPROVE_REFUND' || csAction === 'PARTIAL_SETTLEMENT' || csAction === 'RELEASE_ESCROW') {
      const typeMap: Record<string, string> = {
        APPROVE_REFUND: 'FULL_REFUND',
        PARTIAL_SETTLEMENT: 'PARTIAL_REFUND',
        RELEASE_ESCROW: 'PAYMENT_RELEASE',
      };
      resolveMutation.mutate({ type: typeMap[csAction], comment: csComment });
    } else if (csAction === 'REJECT_DISPUTE') {
      statusMutation.mutate({ status: 'REJECTED' });
    } else if (csAction === 'CLOSE_CASE') {
      statusMutation.mutate({ status: 'CLOSED' });
    } else if (csAction === 'ESCALATE') {
      statusMutation.mutate({ status: 'ESCALATED' });
    } else if (csAction === 'REQUEST_MORE_INFO') {
      statusMutation.mutate({ status: 'UNDER_REVIEW' });
    }
  };

  const handleEvidenceUpload = () => {
    if (!evidenceFiles) return;
    Array.from(evidenceFiles).forEach(file => evidenceMutation.mutate(file));
  };

  if (isLoading || !dispute) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const visibleMessages = messages?.filter(m => !m.isInternalNote || canViewInternal) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/disputes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Disputes
      </Link>

      <PageHeader
        title={dispute.title}
        subtitle={<><DisputeStatusBadge status={dispute.status} /> Booking #{dispute.bookingId} — ${dispute.holdAmount} on hold</>}
      />

      {/* CS Action Bar */}
      {isCS && (
        <Card className="p-4 mb-6 border-l-4 border-primary-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">CS Actions:</span>
            <select
              value={csAction}
              onChange={e => setCsAction(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Select action...</option>
              {CS_ACTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setCsActionOpen(true)}
              disabled={!csAction}
            >
              Execute
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.description}</p>
          </Card>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Category</p>
              <p className="text-sm font-medium text-gray-900">{dispute.disputeCategory.replace(/_/g, ' ')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Requested Resolution</p>
              <p className="text-sm font-medium text-gray-900">{dispute.requestedResolution.replace(/_/g, ' ')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Raised By</p>
              <div className="flex items-center gap-2">
                <Avatar name={raiserUser?.name || `${dispute.raisedByRole}`} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{raiserUser?.name || `${dispute.raisedByRole} #${dispute.raisedById}`}</p>
                  <p className="text-xs text-gray-500">{dispute.raisedByRole}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900">{new Date(dispute.createdAt).toLocaleString()}</p>
            </Card>
          </div>
          {dispute.resolution && (
            <Card className="p-4 border-l-4 border-accent-500">
              <h3 className="font-semibold text-gray-900 mb-2">Resolution</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Type:</span> <span className="font-medium">{dispute.resolution.type.replace(/_/g, ' ')}</span></p>
                <p><span className="text-gray-500">Comment:</span> {dispute.resolution.csComment}</p>
                <p><span className="text-gray-500">Resolved at:</span> {new Date(dispute.resolution.timestamp).toLocaleString()}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 max-h-96 overflow-y-auto space-y-4">
            {visibleMessages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No messages yet</p>
            ) : (
              visibleMessages.map(msg => {
                const senderName = senders?.[msg.fromId] || `${msg.fromRole} #${msg.fromId}`;
                return (
                  <div key={msg.id} className={`flex gap-3 ${msg.fromId === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <Avatar name={senderName} size="sm" />
                      <span className="text-[10px] text-gray-400 leading-tight">{msg.fromRole}</span>
                    </div>
                    <div className={`max-w-[75%] ${msg.fromId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-3 py-2 rounded-xl text-sm ${msg.fromId === user?.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p>{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                        {msg.isInternalNote && <Badge className="text-[10px] px-1.5 py-0">Internal</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); messageMutation.mutate(); } }}
              />
              <Button size="sm" variant="primary" onClick={() => messageMutation.mutate()} loading={messageMutation.isPending} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Evidence Tab */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          {(isCS || isRaiser) && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Upload Evidence</h3>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => setEvidenceFiles(e.target.files)}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Select Files
                </Button>
                {evidenceFiles && evidenceFiles.length > 0 && (
                  <Button variant="primary" onClick={handleEvidenceUpload} loading={evidenceMutation.isPending}>
                    Upload ({evidenceFiles.length} files)
                  </Button>
                )}
              </div>
              {evidenceFiles && evidenceFiles.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">{Array.from(evidenceFiles).map(f => f.name).join(', ')}</p>
              )}
            </Card>
          )}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Uploaded Evidence ({evidence?.length || 0})</h3>
            {!evidence || evidence.length === 0 ? (
              <p className="text-sm text-gray-500">No evidence uploaded yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {evidence.map(ev => (
                  <div key={ev.id} className="border rounded-lg p-2 text-center relative group">
                    {(isCS || isRaiser) && (
                      <button
                        onClick={() => deleteEvidenceMutation.mutate({ id: ev.id, filePath: ev.filePath })}
                        disabled={deleteEvidenceMutation.isPending}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                        title="Delete evidence"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {ev.fileType.startsWith('image/') ? (
                      resolvedEvidence[ev.id] ? (
                        <img src={resolvedEvidence[ev.id]} alt={ev.fileName} className="w-full h-24 object-cover rounded mb-1" />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded mb-1 flex items-center justify-center text-gray-400">
                          <Eye className="w-6 h-6" />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded mb-1 flex items-center justify-center text-gray-400">
                        <Paperclip className="w-6 h-6" />
                      </div>
                    )}
                    <p className="text-xs text-gray-600 truncate">{ev.fileName}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          {!timeline || timeline.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No timeline entries yet</p>
          ) : (
            <DisputeTimeline entries={timeline} />
          )}
        </Card>
      )}

      {/* CS Action Confirmation Modal */}
      <Modal isOpen={csActionOpen} onClose={() => setCsActionOpen(false)} title="CS Action">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Execute <strong>{CS_ACTIONS.find(a => a.value === csAction)?.label}</strong> on this dispute?
          </p>
          <Textarea
            label="Comment (required)"
            value={csComment}
            onChange={e => setCsComment(e.target.value)}
            placeholder="Add a note explaining this action..."
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setCsActionOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCsAction}
              loading={statusMutation.isPending || resolveMutation.isPending}
              disabled={!csComment.trim()}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
