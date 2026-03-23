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
import { KeyRecord } from '@/types';
import { Plus, Eye, EyeOff, RotateCcw, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function KeysPage() {
  const { currentUser } = useAuth();
  const { keyRecords, addKeyRecord, updateKeyRecord } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showPhotocopierCode, setShowPhotocopierCode] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [form, setForm] = useState({ personName: '', keyType: '' });

  if (!currentUser) return null;

  const myKeys = keyRecords.filter(k => k.orgId === currentUser.orgId);
  const activeKeys = myKeys.filter(k => !k.returned);
  const returnedKeys = myKeys.filter(k => k.returned);

  const handleAdd = () => {
    if (!form.personName || !form.keyType) return;
    const record: KeyRecord = {
      id: generateId(),
      orgId: currentUser.orgId,
      personName: form.personName,
      keyType: form.keyType,
      dateIssued: new Date().toISOString().split('T')[0],
      returned: false,
    };
    addKeyRecord(record);
    setForm({ personName: '', keyType: '' });
    setShowModal(false);
    toast('Key record added', 'success');
  };

  const handleReturn = (id: string) => {
    updateKeyRecord(id, { returned: true, returnedDate: new Date().toISOString().split('T')[0] });
    toast('Key marked as returned', 'success');
  };

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keys & Access</h1>
          <p className="text-gray-500">Manage key holders and access codes for your organisation</p>
        </div>

        {/* Access codes */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Photocopier Code</h2></CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-gray-900">
                  {showPhotocopierCode ? '4421' : '••••'}
                </span>
                <button onClick={() => setShowPhotocopierCode(!showPhotocopierCode)} className="text-gray-400 hover:text-gray-600">
                  {showPhotocopierCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">For all photocopiers on your floor</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Building After-Hours Code</h2></CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-gray-900">
                  {showAccessCode ? '8832' : '••••'}
                </span>
                <button onClick={() => setShowAccessCode(!showAccessCode)} className="text-gray-400 hover:text-gray-600">
                  {showAccessCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Valid Mon–Fri, 6pm–midnight and weekends</p>
            </CardBody>
          </Card>
        </div>

        {/* Key register */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Key Register</h2>
                <p className="text-xs text-gray-400 mt-0.5">{activeKeys.length} active key{activeKeys.length !== 1 ? 's' : ''} issued</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { toast('Request submitted to admin', 'success'); }}>
                  <Send className="h-4 w-4" /> Request Key
                </Button>
                <Button size="sm" onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4" /> Add Record
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Person</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Key Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Issued</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myKeys.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-400">No key records</td></tr>
                ) : myKeys.map(k => (
                  <tr key={k.id} className={`border-b border-gray-50 hover:bg-gray-50 ${k.returned ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-3 font-medium text-gray-900">{k.personName}</td>
                    <td className="px-6 py-3 text-gray-600">{k.keyType}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(k.dateIssued)}</td>
                    <td className="px-6 py-3">
                      {k.returned ? (
                        <Badge variant="default">Returned {k.returnedDate ? formatDate(k.returnedDate) : ''}</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {!k.returned && (
                        <Button variant="secondary" size="sm" onClick={() => handleReturn(k.id)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                          Mark Returned
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Key Record" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Person Name</label>
            <input
              type="text"
              value={form.personName}
              onChange={e => setForm(p => ({ ...p, personName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Type</label>
            <select
              value={form.keyType}
              onChange={e => setForm(p => ({ ...p, keyType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            >
              <option value="">Select...</option>
              <option value="Office Key">Office Key</option>
              <option value="Building Master Key">Building Master Key</option>
              <option value="Storage Room Key">Storage Room Key</option>
              <option value="Letterbox Key">Letterbox Key</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.personName || !form.keyType} className="flex-1">Add Record</Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
