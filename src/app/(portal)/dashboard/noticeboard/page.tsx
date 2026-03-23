'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { generateId } from '@/lib/utils';
import { mockOrganisations } from '@/data/organisations';
import { formatDateTime } from '@/lib/utils';
import { Plus, MessageSquare } from 'lucide-react';
import { NoticeboardPost } from '@/types';

const categoryConfig: Record<string, { label: string; variant: string }> = {
  EVENT: { label: 'Event', variant: 'info' },
  NEWS: { label: 'News', variant: 'success' },
  OFFER: { label: 'Offer', variant: 'warning' },
  REQUEST: { label: 'Request', variant: 'default' },
};

export default function NoticeboardPage() {
  const { currentUser } = useAuth();
  const { noticeboardPosts, addNoticeboardPost } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ title: '', body: '', category: 'NEWS' });
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;

  const filtered = filter === 'ALL'
    ? noticeboardPosts
    : noticeboardPosts.filter(p => p.category === filter);

  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    const post: NoticeboardPost = {
      id: generateId(),
      title: form.title,
      body: form.body,
      category: form.category as any,
      orgId: currentUser.orgId,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    addNoticeboardPost(post);
    setSubmitting(false);
    setShowModal(false);
    setForm({ title: '', body: '', category: 'NEWS' });
    toast('Post published successfully', 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Noticeboard</h1>
            <p className="text-gray-500">Community announcements and posts from Ross House tenants</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Create Post
          </Button>
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
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
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
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50">
                    <span className="font-medium text-gray-500">{getOrgName(post.orgId)}</span>
                    <span>·</span>
                    <span>{formatDateTime(post.createdAt)}</span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Post" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
              <option value="EVENT">Event</option>
              <option value="NEWS">News</option>
              <option value="OFFER">Offer</option>
              <option value="REQUEST">Request</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={4} className={inputClass} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Publish Post</Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
