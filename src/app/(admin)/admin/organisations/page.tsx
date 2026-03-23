'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { Building2, Users, Globe, Search, Plus } from 'lucide-react';
import { Organisation } from '@/types';
import { generateId } from '@/lib/utils';

export default function AdminOrgsPage() {
  const { currentUser } = useAuth();
  const { organisations, users, updateOrganisation, addOrganisation } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Organisation | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Organisation>>({});
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Organisation>>({
    name: '',
    type: 'NON_PROFIT',
    contactEmail: '',
    contactPhone: '',
    address: '',
    description: '',
    services: '',
    openingHours: 'Mon-Fri: 9am-5pm',
    publicListing: false,
  });
  const [adding, setAdding] = useState(false);

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const typeVariant = (t: string) => {
    if (t === 'NON_PROFIT') return 'success';
    if (t === 'COMMERCIAL') return 'info';
    if (t === 'GOVERNMENT') return 'warning';
    return 'default';
  };

  const typeLabel = (t: string) => t.replace(/_/g, ' ');

  const getUserCount = (orgId: string) => users.filter(u => u.orgId === orgId && u.status === 'APPROVED').length;

  const filtered = organisations.filter(org => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.contactEmail.toLowerCase().includes(q) ||
      org.type.toLowerCase().includes(q)
    );
  });

  const openOrg = (org: Organisation) => {
    setSelected(org);
    setForm(org);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    updateOrganisation(selected.id, form);
    setSaving(false);
    setEditing(false);
    toast('Organisation updated successfully', 'success');
    setSelected(prev => prev ? { ...prev, ...form } : null);
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.contactEmail) {
      toast('Name and email are required', 'error');
      return;
    }
    setAdding(true);
    await new Promise(r => setTimeout(r, 500));
    const newOrg: Organisation = {
      id: 'org-' + generateId().toLowerCase(),
      name: addForm.name!,
      type: (addForm.type as Organisation['type']) || 'NON_PROFIT',
      contactEmail: addForm.contactEmail!,
      contactPhone: addForm.contactPhone || '',
      address: addForm.address || '',
      description: addForm.description || '',
      services: addForm.services || '',
      openingHours: addForm.openingHours || 'Mon-Fri: 9am-5pm',
      publicListing: addForm.publicListing || false,
      representatives: [],
      activeUsers: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    addOrganisation(newOrg);
    setAdding(false);
    setShowAddModal(false);
    setAddForm({
      name: '',
      type: 'NON_PROFIT',
      contactEmail: '',
      contactPhone: '',
      address: '',
      description: '',
      services: '',
      openingHours: 'Mon-Fri: 9am-5pm',
      publicListing: false,
    });
    toast(`${newOrg.name} added successfully`, 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
            <p className="text-gray-500">{organisations.length} organisations registered</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add Organisation
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or type..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase"># Users</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No organisations found</td></tr>
              ) : filtered.map(org => (
                <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1e3a5f] rounded-md flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{org.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={typeVariant(org.type) as any}>{typeLabel(org.type)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600">{org.contactEmail}</p>
                    <p className="text-xs text-gray-400">{org.contactPhone}</p>
                  </td>
                  <td className="px-6 py-4">
                    {org.publicListing
                      ? <Badge variant="success"><Globe className="h-3 w-3 mr-1 inline" />Public</Badge>
                      : <Badge variant="default">Private</Badge>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-sm">{getUserCount(org.id)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" onClick={() => openOrg(org)}>View / Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View/Edit Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={editing ? `Edit: ${selected?.name}` : selected?.name || ''} size="xl">
        {selected && (
          <div className="space-y-4">
            {!editing ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {([
                    ['Type', selected.type.replace(/_/g, ' ')],
                    ['Email', selected.contactEmail],
                    ['Phone', selected.contactPhone],
                    ['Address', selected.address],
                    ['Opening Hours', selected.openingHours],
                    ['Directory', selected.publicListing ? 'Public' : 'Private'],
                  ] as [string, string][]).map(([l, v]) => (
                    <div key={l}>
                      <p className="text-xs text-gray-500 mb-0.5">{l}</p>
                      <p className="text-gray-800 font-medium">{v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{selected.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Services</p>
                  <p className="text-sm text-gray-700">{selected.services}</p>
                </div>
                {selected.representatives.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Representatives</p>
                    {selected.representatives.map((r, i) => (
                      <p key={i} className="text-sm text-gray-700">{r.name} ({r.role}) — {r.email}</p>
                    ))}
                  </div>
                )}
                <div className="pt-2">
                  <Button onClick={() => setEditing(true)}>Edit Organisation</Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Name</label>
                    <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Type</label>
                    <select value={form.type || 'NON_PROFIT'} onChange={e => setForm(p => ({ ...p, type: e.target.value as Organisation['type'] }))} className={inputClass}>
                      <option value="NON_PROFIT">Non Profit</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="COMMUNITY">Community</option>
                      <option value="GOVERNMENT">Government</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Contact Email</label>
                    <input type="email" value={form.contactEmail || ''} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Contact Phone</label>
                    <input type="text" value={form.contactPhone || ''} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Address</label>
                    <input type="text" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Services</label>
                    <textarea value={form.services || ''} onChange={e => setForm(p => ({ ...p, services: e.target.value }))} rows={2} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Opening Hours</label>
                    <input type="text" value={form.openingHours || ''} onChange={e => setForm(p => ({ ...p, openingHours: e.target.value }))} className={inputClass} />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.publicListing || false} onChange={e => setForm(p => ({ ...p, publicListing: e.target.checked }))} className="h-4 w-4 rounded" />
                    Show in public directory
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
                  <Button loading={saving} onClick={handleSave} className="flex-1">Save Changes</Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Add Organisation Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Organisation" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Organisation Name *</label>
              <input type="text" value={addForm.name || ''} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Community Arts Collective" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select value={addForm.type || 'NON_PROFIT'} onChange={e => setAddForm(p => ({ ...p, type: e.target.value as Organisation['type'] }))} className={inputClass}>
                <option value="NON_PROFIT">Non Profit</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="COMMUNITY">Community</option>
                <option value="GOVERNMENT">Government</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Contact Email *</label>
              <input type="email" value={addForm.contactEmail || ''} onChange={e => setAddForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="contact@org.org.au" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Contact Phone</label>
              <input type="text" value={addForm.contactPhone || ''} onChange={e => setAddForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="03 XXXX XXXX" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Opening Hours</label>
              <input type="text" value={addForm.openingHours || ''} onChange={e => setAddForm(p => ({ ...p, openingHours: e.target.value }))} placeholder="Mon-Fri: 9am-5pm" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Address</label>
              <input type="text" value={addForm.address || ''} onChange={e => setAddForm(p => ({ ...p, address: e.target.value }))} placeholder="Level X, 247 Flinders Lane, Melbourne VIC 3000" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea value={addForm.description || ''} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description of the organisation..." className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Services</label>
              <input type="text" value={addForm.services || ''} onChange={e => setAddForm(p => ({ ...p, services: e.target.value }))} placeholder="e.g. Community programs, advocacy, events" className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={addForm.publicListing || false} onChange={e => setAddForm(p => ({ ...p, publicListing: e.target.checked }))} className="h-4 w-4 rounded" />
            Show in public directory
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
            <Button loading={adding} onClick={handleAdd} className="flex-1">Add Organisation</Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
