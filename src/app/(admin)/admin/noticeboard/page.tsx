'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { mockOrganisations } from '@/data/organisations';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare, Trash2 } from 'lucide-react';

const categoryConfig: Record<string, { label: string; variant: string }> = {
  EVENT: { label: 'Event', variant: 'info' },
  NEWS: { label: 'News', variant: 'success' },
  OFFER: { label: 'Offer', variant: 'warning' },
  REQUEST: { label: 'Request', variant: 'default' },
};

export default function AdminNoticeboardPage() {
  const { currentUser } = useAuth();
  const { noticeboardPosts, deleteNoticeboardPost } = useApp();
  const [filter, setFilter] = useState('ALL');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const getOrgName = (orgId: string) =>
    mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const filtered = filter === 'ALL'
    ? noticeboardPosts
    : noticeboardPosts.filter(p => p.category === filter);

  const handleDelete = (id: string) => {
    deleteNoticeboardPost(id);
    setConfirmDelete(null);
    toast('Post removed from noticeboard', 'success');
  };

  const postToDelete = confirmDelete
    ? noticeboardPosts.find(p => p.id === confirmDelete)
    : null;

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Noticeboard</h1>
          <p className="text-gray-500">
            {noticeboardPosts.length} post{noticeboardPosts.length !== 1 ? 's' : ''} from tenants · moderate or remove inappropriate content
          </p>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'EVENT', 'NEWS', 'OFFER', 'REQUEST'].map(cat => (
            <Button
              key={cat}
              variant={filter === cat ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat === 'ALL' ? 'All' : categoryConfig[cat]?.label || cat}
              {cat !== 'ALL' && (
                <span className="ml-1 text-xs opacity-70">
                  ({noticeboardPosts.filter(p => p.category === cat).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10">
                <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No posts in this category</p>
              </CardBody>
            </Card>
          ) : filtered.map(post => {
            const cat = categoryConfig[post.category] || { label: post.category, variant: 'default' };
            return (
              <Card key={post.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={cat.variant as any}>{cat.label}</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{post.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{post.body}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(post.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50">
                    <span className="font-medium text-gray-500">{getOrgName(post.orgId)}</span>
                    <span>·</span>
                    <span>{formatDateTime(post.createdAt)}</span>
                    <span>·</span>
                    <span className="font-mono text-gray-300 text-xs">{post.id}</span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove Post" size="sm">
        {postToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove this post from the noticeboard? This action cannot be undone.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{postToDelete.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{getOrgName(postToDelete.orgId)}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => handleDelete(confirmDelete!)}
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
              >
                Remove Post
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
