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
import { Plus, Trash2, Globe, Eye, EyeOff, User, Building2, Pencil } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, updateCurrentUser } = useAuth();
  const { organisations, updateOrganisation, updateUser, users } = useApp();
  const [showPhotoCode, setShowPhotoCode] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  // Edit account state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [editSaving, setEditSaving] = useState(false);

  if (!currentUser) return null;

  const org = organisations.find(o => o.id === currentUser.orgId);

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'Administrator',
      MEMBER_TENANT: 'Member Tenant',
      COMMERCIAL_TENANT: 'Commercial Tenant',
      FACILITY_USER: 'Facility User',
      TRADES: 'Trades',
      COMMUNITY_MEMBER: 'Community Member',
    };
    return map[role] || role;
  };

  const statusVariant = (status: string) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'PENDING') return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'default';
  };

  const openEditModal = () => {
    setEditForm({ name: currentUser.name, phone: currentUser.phone || '', password: '', confirmPassword: '' });
    setShowEditModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    setEditSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const updates: { name: string; phone?: string; password?: string } = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim() || undefined,
    };
    if (editForm.password) {
      updates.password = editForm.password;
    }
    updateUser(currentUser.id, updates);
    // Sync AuthContext so the UI reflects changes immediately without re-login
    const refreshed = users.find(u => u.id === currentUser.id);
    if (refreshed) updateCurrentUser({ ...refreshed, ...updates });
    setEditSaving(false);
    setShowEditModal(false);
    toast('Account details updated successfully', 'success');
  };

  const [form, setForm] = useState({
    name: org?.name || '',
    description: org?.description || '',
    phone: org?.contactPhone || '',
    email: org?.contactEmail || '',
    address: org?.address || '',
    services: org?.services || '',
    openingHours: org?.openingHours || '',
    publicListing: org?.publicListing ?? true,
  });

  const [reps, setReps] = useState(org?.representatives || []);
  const [newRep, setNewRep] = useState({ name: '', role: '', email: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    updateOrganisation(currentUser.orgId, {
      name: form.name,
      description: form.description,
      contactPhone: form.phone,
      contactEmail: form.email,
      address: form.address,
      services: form.services,
      openingHours: form.openingHours,
      publicListing: form.publicListing,
      representatives: reps,
    });
    setSaving(false);
    toast('Profile updated successfully', 'success');
  };

  const addRep = () => {
    if (!newRep.name) return;
    setReps(prev => [...prev, { ...newRep }]);
    setNewRep({ name: '', role: '', email: '' });
  };

  const removeRep = (i: number) => setReps(prev => prev.filter((_, idx) => idx !== i));

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent";

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organisation Profile</h1>
          <p className="text-gray-500">Manage your organisation&apos;s details and settings</p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Your Account
              </h2>
              <Button variant="ghost" size="sm" onClick={openEditModal}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-lg font-bold shrink-0">
                {currentUser.avatarInitials || currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
                {currentUser.phone && <p className="text-sm text-gray-400">{currentUser.phone}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant="info">{roleLabel(currentUser.role)}</Badge>
                <Badge variant={statusVariant(currentUser.status) as any}>{currentUser.status}</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Access Codes */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Building Access Codes</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Photocopier Code</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-gray-900">{showPhotoCode ? '4421' : '••••'}</span>
                  <button
                    onClick={() => setShowPhotoCode(!showPhotoCode)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPhotoCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">For all photocopiers on your floor</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Building After-Hours Code</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-gray-900">{showAccessCode ? '8832' : '••••'}</span>
                  <button
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showAccessCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Valid Mon–Fri, 6pm–midnight and weekends</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Organisation Info */}
        {org && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                Organisation Details
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Type</p>
                  <p className="text-gray-700 mt-0.5">{org.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Active Users</p>
                  <p className="text-gray-700 mt-0.5">{org.activeUsers}</p>
                </div>
                {org.contactPhone && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">Phone</p>
                    <p className="text-gray-700 mt-0.5">{org.contactPhone}</p>
                  </div>
                )}
                {org.contactEmail && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">Contact Email</p>
                    <p className="text-gray-700 mt-0.5">{org.contactEmail}</p>
                  </div>
                )}
                {org.address && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-400 uppercase">Address</p>
                    <p className="text-gray-700 mt-0.5">{org.address}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Basic Information</h2></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services / Programs</label>
              <input type="text" value={form.services} onChange={e => setForm(p => ({ ...p, services: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
              <input type="text" value={form.openingHours} onChange={e => setForm(p => ({ ...p, openingHours: e.target.value }))} className={inputClass} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Directory Listing</h2></CardHeader>
          <CardBody>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publicListing}
                onChange={e => setForm(p => ({ ...p, publicListing: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Show in public directory
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Your organisation will be listed in the Ross House community directory visible to other tenants and members.</p>
              </div>
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Representatives</h2></CardHeader>
          <CardBody className="space-y-4">
            {reps.map((rep, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{rep.name}</p>
                  <p className="text-xs text-gray-400">{rep.role} · {rep.email}</p>
                </div>
                <button onClick={() => removeRep(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Add Representative</p>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="Name" value={newRep.name} onChange={e => setNewRep(p => ({ ...p, name: e.target.value }))} className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]" />
                <input type="text" placeholder="Role" value={newRep.role} onChange={e => setNewRep(p => ({ ...p, role: e.target.value }))} className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]" />
                <input type="email" placeholder="Email" value={newRep.email} onChange={e => setNewRep(p => ({ ...p, email: e.target.value }))} className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]" />
              </div>
              <Button variant="outline" size="sm" onClick={addRep}>
                <Plus className="h-3.5 w-3.5" /> Add Person
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} size="lg">Save Changes</Button>
        </div>
      </div>

      {/* Edit Account Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Account Details" size="md">
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. 0400 123 456"
              className={inputClass}
            />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">Change Password (optional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={e => setEditForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={editSaving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
