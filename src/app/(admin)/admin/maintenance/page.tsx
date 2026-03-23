'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { mockOrganisations } from '@/data/organisations';
import { formatDateTime } from '@/lib/utils';
import { MaintenanceStatus, MaintenancePriority } from '@/types';
import { MessageSquare } from 'lucide-react';

export default function AdminMaintenancePage() {
  const { currentUser } = useAuth();
  const { maintenanceRequests, updateMaintenanceRequest } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({ status: 'OPEN' as MaintenanceStatus, note: '' });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const filtered = maintenanceRequests.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  const selectedRequest = selected ? maintenanceRequests.find(r => r.id === selected) : null;

  const openUpdate = (id: string) => {
    const req = maintenanceRequests.find(r => r.id === id);
    if (!req) return;
    setSelected(id);
    setNoteForm({ status: req.status, note: req.adminNote || '' });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    updateMaintenanceRequest(selected, {
      status: noteForm.status,
      adminNote: noteForm.note,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    setSelected(null);
    toast('Maintenance request updated', 'success');
  };

  const priorityVariant = (p: string) => {
    const m: Record<string, string> = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' };
    return m[p] as any;
  };

  const statusVariant = (s: string) => {
    const m: Record<string, string> = { OPEN: 'danger', IN_PROGRESS: 'info', RESOLVED: 'success' };
    return m[s] as any;
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  const openCount = maintenanceRequests.filter(r => r.status === 'OPEN').length;
  const urgentCount = maintenanceRequests.filter(r => r.priority === 'URGENT' && r.status !== 'RESOLVED').length;

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Queue</h1>
          <p className="text-gray-500">
            {openCount} open request{openCount !== 1 ? 's' : ''}
            {urgentCount > 0 && <span className="ml-2 text-red-500 font-medium">· {urgentCount} urgent</span>}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <span className="text-xs text-gray-500 self-center">Status:</span>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(f => (
              <Button key={f} variant={statusFilter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setStatusFilter(f)}>
                {f.replace('_', ' ')}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-gray-500 self-center">Priority:</span>
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
              <Button key={f} variant={priorityFilter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setPriorityFilter(f)}>
                {f}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No requests found</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 ${r.status === 'OPEN' && r.priority === 'URGENT' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-700 text-sm">{r.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{r.description}</p>
                      {r.adminNote && (
                        <p className="text-xs text-blue-600 mt-0.5 truncate max-w-[180px]">Note: {r.adminNote}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{getOrgName(r.orgId)}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{r.category}</td>
                    <td className="px-6 py-4"><Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={statusVariant(r.status)}>{r.status.replace('_', ' ')}</Badge></td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{formatDateTime(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => openUpdate(r.id)}>
                        <MessageSquare className="h-3.5 w-3.5" /> Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Update Maintenance Request" size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p className="font-semibold text-gray-800">{selectedRequest.title}</p>
              <p className="text-gray-600">{selectedRequest.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={priorityVariant(selectedRequest.priority)}>{selectedRequest.priority}</Badge>
                <Badge variant="outline">{selectedRequest.category}</Badge>
                <Badge variant="default">{getOrgName(selectedRequest.orgId)}</Badge>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Update Status</label>
              <select value={noteForm.status} onChange={e => setNoteForm(p => ({ ...p, status: e.target.value as MaintenanceStatus }))} className={inputClass}>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Admin Note</label>
              <textarea value={noteForm.note} onChange={e => setNoteForm(p => ({ ...p, note: e.target.value }))} rows={3} placeholder="Add a note for the tenant (e.g. 'Plumber scheduled for Thursday')..." className={inputClass} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
              <Button loading={saving} onClick={handleSave} className="flex-1">Save Update</Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
