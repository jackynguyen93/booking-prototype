'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { generateId, formatCurrency, formatDate } from '@/lib/utils';
import { GrantApplication } from '@/types';
import { Plus, Award, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  SUBMITTED: { label: 'Submitted', variant: 'info', icon: <Clock className="h-4 w-4" /> },
  UNDER_REVIEW: { label: 'Under Review', variant: 'warning', icon: <AlertCircle className="h-4 w-4" /> },
  APPROVED: { label: 'Approved', variant: 'success', icon: <CheckCircle className="h-4 w-4" /> },
  REJECTED: { label: 'Rejected', variant: 'danger', icon: <XCircle className="h-4 w-4" /> },
};

export default function GrantsPage() {
  const { currentUser } = useAuth();
  const { grantApplications, addGrantApplication } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ description: '', amountRequested: '', purpose: '' });

  if (!currentUser) return null;

  if (currentUser.role !== 'MEMBER_TENANT' && currentUser.role !== 'COMMERCIAL_TENANT' && currentUser.role !== 'ADMIN') {
    return (
      <PortalLayout>
        <div className="text-center py-16">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Grants are only available to member tenant organisations.</p>
        </div>
      </PortalLayout>
    );
  }

  const myApps = grantApplications
    .filter(a => a.orgId === currentUser.orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amountRequested) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const app: GrantApplication = {
      id: generateId(),
      orgId: currentUser.orgId,
      userId: currentUser.id,
      description: form.description,
      amountRequested: parseFloat(form.amountRequested),
      purpose: form.purpose,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGrantApplication(app);
    setSubmitting(false);
    setShowModal(false);
    setForm({ description: '', amountRequested: '', purpose: '' });
    toast('Grant application submitted successfully', 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grants</h1>
            <p className="text-gray-500">Apply for Ross House grants and track your applications</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Apply for Grant
          </Button>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 text-sm">About Ross House Grants</h3>
          <p className="text-sm text-blue-700 mt-1">
            Ross House Association provides grants to member tenant organisations to support community programs, events, and capacity building. Applications are reviewed quarterly by the board.
          </p>
        </div>

        {/* Applications */}
        <div className="space-y-4">
          {myApps.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10">
                <Award className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">No grant applications yet</p>
                <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>Apply Now</Button>
              </CardBody>
            </Card>
          ) : myApps.map(app => {
            const config = statusConfig[app.status];
            return (
              <Card key={app.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={config.variant as any}>{config.label}</Badge>
                        <span className="text-xs text-gray-400">{formatDate(app.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{app.description}</p>
                      <p className="text-xs text-gray-400">Purpose: {app.purpose}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(app.amountRequested)}</p>
                      <p className="text-xs text-gray-400">requested</p>
                    </div>
                  </div>

                  {/* Status tracker */}
                  <div className="mt-4 flex items-center gap-2">
                    {(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] as const).map((s, i) => {
                      const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
                      const currentIdx = statuses.indexOf(app.status);
                      const thisIdx = statuses.indexOf(s);
                      const isRejected = app.status === 'REJECTED';
                      return (
                        <div key={s} className="flex items-center gap-2 flex-1">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isRejected && thisIdx === currentIdx ? 'bg-red-500 text-white' :
                            thisIdx <= currentIdx && !isRejected ? 'bg-[#1e3a5f] text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {thisIdx < currentIdx ? '✓' : i + 1}
                          </div>
                          <span className="text-xs text-gray-500 hidden sm:inline">{statusConfig[s].label}</span>
                          {i < 2 && <div className={`flex-1 h-0.5 ${thisIdx < currentIdx && !isRejected ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Grant" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Category</label>
            <select value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} className={inputClass}>
              <option value="">Select purpose...</option>
              <option value="Program Delivery">Program Delivery</option>
              <option value="Equipment Purchase">Equipment Purchase</option>
              <option value="Program Expansion">Program Expansion</option>
              <option value="Event Funding">Event Funding</option>
              <option value="Capacity Building">Capacity Building</option>
              <option value="Staff Training">Staff Training</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested (AUD) <span className="text-red-500">*</span></label>
            <input type="number" min="100" max="50000" value={form.amountRequested} onChange={e => setForm(p => ({ ...p, amountRequested: e.target.value }))} placeholder="e.g. 5000" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe the project or need the grant would support..." className={inputClass} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Submit Application</Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
