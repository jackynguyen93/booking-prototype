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
import { generateId } from '@/lib/utils';
import { MaintenanceRequest, MaintenancePriority, MaintenanceCategory, MaintenanceStatus } from '@/types';
import { Plus, AlertTriangle, Clock, CheckCircle, Wrench } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const priorityVariant = (p: MaintenancePriority) => {
  const m: Record<string, string> = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' };
  return m[p] as any;
};

const statusIcon = (s: MaintenanceStatus) => {
  if (s === 'OPEN') return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (s === 'IN_PROGRESS') return <Clock className="h-4 w-4 text-blue-500" />;
  return <CheckCircle className="h-4 w-4 text-green-500" />;
};

const statusVariant = (s: MaintenanceStatus) => {
  const m: Record<string, string> = { OPEN: 'danger', IN_PROGRESS: 'info', RESOLVED: 'success' };
  return m[s] as any;
};

export default function MaintenancePage() {
  const { currentUser } = useAuth();
  const { maintenanceRequests, addMaintenanceRequest } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as MaintenancePriority,
    category: 'OTHER' as MaintenanceCategory,
  });

  if (!currentUser) return null;

  const myRequests = maintenanceRequests
    .filter(r => r.orgId === currentUser.orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const req: MaintenanceRequest = {
      id: generateId(),
      orgId: currentUser.orgId,
      userId: currentUser.id,
      title: form.title,
      description: form.description,
      priority: form.priority,
      category: form.category,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addMaintenanceRequest(req);
    setSubmitting(false);
    setShowForm(false);
    setForm({ title: '', description: '', priority: 'MEDIUM', category: 'OTHER' });
    toast('Maintenance request submitted successfully', 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
            <p className="text-gray-500">Submit and track maintenance issues</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as MaintenanceStatus[]).map(status => (
            <div key={status} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
              {statusIcon(status)}
              <div>
                <p className="text-2xl font-bold text-gray-900">{myRequests.filter(r => r.status === status).length}</p>
                <p className="text-xs text-gray-500">{status.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Requests list */}
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10">
                <Wrench className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No maintenance requests yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>Submit a Request</Button>
              </CardBody>
            </Card>
          ) : myRequests.map(r => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5">{statusIcon(r.status)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{r.description}</p>
                      {r.adminNote && (
                        <div className="mt-2 bg-blue-50 border border-blue-100 rounded p-2 text-xs text-blue-700">
                          <strong>Admin note:</strong> {r.adminNote}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant={statusVariant(r.status)}>{r.status.replace('_', ' ')}</Badge>
                        <Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge>
                        <Badge variant="outline">{r.category}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Submitted {formatDateTime(r.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Submit Maintenance Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief description of the issue" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed description..." className={inputClass} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as MaintenancePriority }))} className={inputClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as MaintenanceCategory }))} className={inputClass}>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="HVAC">HVAC / Air Conditioning</option>
                <option value="CLEANING">Cleaning</option>
                <option value="IT">IT / Technology</option>
                <option value="SECURITY">Security / Access</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
