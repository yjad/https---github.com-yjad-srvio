import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { Button, Avatar, Badge } from '@/components/shared';
import { cn } from '@/utils/cn';
import { Send, Paperclip, FileText, X, Pencil, Trash2, Check, Ban } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { UserRole, ServiceComment } from '@/types';

function AttachmentImage({ src, className }: { src: string; className: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (src.startsWith('images/')) {
      mockApi.getImageBlob(src).then(setDataUrl);
    } else {
      setDataUrl(src);
    }
  }, [src]);
  if (!dataUrl) return <div className={cn('animate-pulse bg-gray-200 rounded-lg', className)} />;
  return <img src={dataUrl} alt="" className={className} />;
}

interface ServiceCommentThreadProps {
  serviceId: number;
  currentUserId: number;
  currentUserRole: UserRole;
  currentUserName: string;
  allowAttachments?: boolean;
}

function canModifyComment(comment: ServiceComment, allComments: ServiceComment[], userId: number): boolean {
  if (comment.fromId !== userId) return false;
  const idx = allComments.findIndex(c => c.id === comment.id);
  if (idx === -1) return false;
  return !allComments.slice(idx + 1).some(c => c.fromId !== comment.fromId);
}

export default function ServiceCommentThread({ serviceId, currentUserId, currentUserRole, currentUserName, allowAttachments }: ServiceCommentThreadProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['service-comments', serviceId],
    queryFn: () => mockApi.getServiceComments(serviceId),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const addComment = useMutation({
    mutationFn: () => mockApi.addServiceComment({
      serviceId, fromId: currentUserId, fromName: currentUserName, fromRole: currentUserRole, message, attachments: attachments.length > 0 ? attachments : undefined,
    }),
    onSuccess: () => {
      setMessage('');
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['service-comments', serviceId] });
    },
  });

  const updateComment = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { message: string; attachments?: string[] } }) =>
      mockApi.updateServiceComment(id, data),
    onSuccess: () => {
      setEditingId(null);
      setEditMessage('');
      setEditAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['service-comments', serviceId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (id: number) => mockApi.deleteServiceComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-comments', serviceId] });
    },
  });

  const isStaff = currentUserRole === 'ADMIN' || currentUserRole === 'CUSTOMER_SERVICE';

  async function processFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          if (file.type.startsWith('image/')) {
            try {
              const path = await mockApi.saveImage(reader.result, 'attachments');
              resolve(path);
            } catch {
              resolve(reader.result);
            }
          } else {
            resolve(reader.result);
          }
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Promise.all(Array.from(files).map(processFile)).then(paths => {
      setAttachments(prev => [...prev, ...paths]);
    });
    e.target.value = '';
  }

  function handleEditFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Promise.all(Array.from(files).map(processFile)).then(paths => {
      setEditAttachments(prev => [...prev, ...paths]);
    });
    e.target.value = '';
  }

  function startEdit(c: ServiceComment) {
    setEditingId(c.id);
    setEditMessage(c.message);
    setEditAttachments(c.attachments ? [...c.attachments] : []);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditMessage('');
    setEditAttachments([]);
  }

  function saveEdit(c: ServiceComment) {
    if (!editMessage.trim()) return;
    updateComment.mutate({
      id: c.id,
      data: { message: editMessage.trim(), attachments: editAttachments.length > 0 ? editAttachments : undefined },
    });
  }

  function handleDelete(c: ServiceComment) {
    if (!window.confirm('Delete this message?')) return;
    deleteComment.mutate(c.id);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-sm text-gray-500 text-center py-4">Loading messages...</div>
        ) : comments && comments.length > 0 ? (
          comments.map(c => {
            const canModify = canModifyComment(c, comments, currentUserId);
            const isEditing = editingId === c.id;

            return (
              <div key={c.id} className={cn('flex gap-2 group', isStaff ? '' : 'flex-row-reverse')}>
                <Avatar name={c.fromName} size="sm" className="mt-1 shrink-0" />
                <div className={cn('max-w-[80%]', isStaff ? '' : 'items-end flex flex-col')}>
                  <div className={cn('rounded-2xl px-3 py-2 text-sm', c.fromRole === currentUserRole && isStaff ? 'bg-primary-50 text-gray-900' : c.fromRole === 'PROVIDER' ? 'bg-accent-50 text-gray-900' : 'bg-gray-100 text-gray-900')}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{c.fromName}</span>
                      <Badge>{c.fromRole}</Badge>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                      {c.edited && <span className="text-xs text-gray-400 italic">(edited)</span>}
                      {canModify && !isEditing && (
                        <span className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => startEdit(c)} className="p-0.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700" title="Edit">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => handleDelete(c)} className="p-0.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600" title="Delete">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editMessage}
                          onChange={e => setEditMessage(e.target.value)}
                          rows={3}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          autoFocus
                        />
                        {editAttachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editAttachments.map((att, i) => (
                              <div key={i} className="relative group">
                                {att.startsWith('data:image') || att.startsWith('images/') ? (
                                  <AttachmentImage src={att} className="w-16 h-16" />
                                ) : (
                                  <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                )}
                                <button type="button" onClick={() => setEditAttachments(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-1">
                          <input type="file" accept="image/*,application/pdf" multiple className="hidden" id={`edit-file-${c.id}`} onChange={handleEditFileUpload} />
                          <label htmlFor={`edit-file-${c.id}`} className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors">
                            <Paperclip className="w-3.5 h-3.5" />
                          </label>
                          <Button size="sm" onClick={() => saveEdit(c)} loading={updateComment.isPending} disabled={!editMessage.trim()}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={cancelEdit}>
                            <Ban className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{c.message}</p>
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {c.attachments.map((att, i) =>
                              att.startsWith('data:image') || att.startsWith('images/') ? (
                                <AttachmentImage key={i} src={att} className="w-20 h-20 rounded-lg object-cover border" />
                              ) : (
                                <a key={i} href={att} download className="flex items-center gap-1 text-xs text-primary-600 hover:underline bg-white px-2 py-1 rounded border">
                                  <FileText className="w-3 h-3" /> Document {i + 1}
                                </a>
                              )
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-400 text-center py-4">No messages yet. Start the conversation.</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={e => { e.preventDefault(); if (message.trim()) addComment.mutate(); }}
        className="space-y-2"
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.startsWith('data:image') || att.startsWith('images/') ? (
                  <AttachmentImage src={att} className="w-16 h-16" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (message.trim()) addComment.mutate(); } }}
          />
          <div className="flex gap-1">
            {allowAttachments && (
              <>
                <input type="file" accept="image/*,application/pdf" multiple className="hidden" id={`file-${serviceId}`} onChange={handleFileUpload} />
                <label htmlFor={`file-${serviceId}`} className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors">
                  <Paperclip className="w-4 h-4" />
                </label>
              </>
            )}
            <Button type="submit" size="sm" loading={addComment.isPending} disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
