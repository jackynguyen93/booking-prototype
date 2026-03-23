'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { generateId } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { mockOrganisations } from '@/data/organisations';
import { KeyRecord } from '@/types';
import { Plus, RotateCcw, Eye, EyeOff, Key } from 'lucide-react';

const ACCESS_CODES = [
  { label: 'Photocopier Code', code: '4421', description: 'For all photocopiers on each floor' },
  { label: 'Building After-Hours Code', code: '8832', description: 'Valid Mon–Fri 6pm–midnight and weekends' },
  { label: 'Basement Car Park Code', code: '1109', description: 'Access to basement parking level' },
];

export default function AdminKeysPage() {
  const { currentUser } = useAuth();
  const { keyRecords, addKeyRecord, updateKeyRecord } = useApp();

  const [orgFilter, setOrgFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [showModal, setShowModal] = useState(false);
  const [showCode, setShowCode] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ orgId: '', personName: '', keyType: '' });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const getOrgName = (orgId: string) =>
    mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const filtered = keyRecords.filter(k => {
    if (orgFilter !== 'ALL' && k.orgId !== orgFilter) return false;
    if (statusFilter === 'ACTIVE' && k.returned) return false;
    if (statusFilter === 'RETURNED' && !k.returned) return false;
    return true;
  });

  const activeCount = keyRecords.filter(k => !k.returned).length;

  const handleAdd = () => {
    if (!form.orgId || !form.personName || !form.keyType) return;
    const record: KeyRecord = {
      id: generateId(),
      orgId: form.orgId,
      personName: form.personName,
      keyType: form.keyType,
      dateIssued: new Date().toISOString().split('T')[0],
      returned: false,
    };
    addKeyRecord(record);
    setForm({ orgId: '', personName: '', keyType: '' });
    setShowModal(false);
    toast('Key record added', 'success');
  };

  const handleReturn = (id: string) => {
    updateKeyRecord(id, { returned: true, returnedDate: new Date().toISOString().split('T')[0] });
    toast('Key marked as returned', 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keys & Access</h1>
          <p className="text-gray-500">
            {activeCount} active key{activeCount !== 1 ? 's' : ''} issued across all organisations
          </p>
        </div>

        {/* Building access codes */}
        <div className="grid sm:grid-cols-3 gap-4">
          {ACCESS_CODES.map(ac => (
            <Card key={ac.label}>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-[#1e3a5f]" />
                  <p className="text-sm font-semibold text-gray-900">{ac.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl font-bold text-gray-900">
                    {showCode[ac.label] ? ac.code : '••••'}
                  </span>
                  <button
                    onClick={() => setShowCode(prev => ({ ...prev, [ac.label]: !prev[ac.label] }))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showCode[ac.label] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{ac.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters + actions */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">Status:</span>
              {['ALL', 'ACTIVE', 'RETURNED'].map(f => (
                <Button key={f} variant={statusFilter === f ? 'primary' : 'secondary'} size="sm"
                  onClick={() => setStatusFilter(f)}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">Org:</span>
              <select
                value={orgFilter}
                onChange={e => setOrgFilter(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <option value="ALL">All Orgs</option>
                {mockOrganisations.filter(o => o.id !== 'org-1').map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Issue Key
          </Button>
        </div>

        {/* Key records table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Person</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Key Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date Issued</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No key records found</td></tr>
                ) : filtered.map(k => (
                  <tr key={k.id} className={`border-b border-gray-50 hover:bg-gray-50 ${k.returned ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{k.personName}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{getOrgName(k.orgId)}</td>
                    <td className="px-6 py-4 text-gray-700">{k.keyType}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(k.dateIssued)}</td>
                    <td className="px-6 py-4">
                      {k.returned ? (
                        <Badge variant="default">Returned {k.returnedDate ? formatDate(k.returnedDate) : ''}</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!k.returned && (
                        <Button variant="secondary" size="sm" onClick={() => handleReturn(k.id)}>
                          <RotateCcw className="h-3.5 w-3.5" /> Mark Returned
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue Key" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
            <select
              value={form.orgId}
              onChange={e => setForm(p => ({ ...p, orgId: e.target.value }))}
              className={inputClass}
            >
              <option value="">Select organisation...</option>
              {mockOrganisations.filter(o => o.id !== 'org-1').map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Person Name</label>
            <input
              type="text"
              value={form.personName}
              onChange={e => setForm(p => ({ ...p, personName: e.target.value }))}
              placeholder="Full name of key holder"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Type</label>
            <select
              value={form.keyType}
              onChange={e => setForm(p => ({ ...p, keyType: e.target.value }))}
              className={inputClass}
            >
              <option value="">Select key type...</option>
              <option value="Office Key">Office Key</option>
              <option value="Building Master Key">Building Master Key</option>
              <option value="Storage Room Key">Storage Room Key</option>
              <option value="Letterbox Key">Letterbox Key</option>
              <option value="Basement Car Park Key">Basement Car Park Key</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={!form.orgId || !form.personName || !form.keyType}
              className="flex-1"
            >
              Issue Key
            </Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
