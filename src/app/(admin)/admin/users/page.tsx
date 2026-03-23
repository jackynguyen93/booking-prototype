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
import { formatDate } from '@/lib/utils';
import { UserRole } from '@/types';
import { CheckCircle, XCircle, UserCheck, Search, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { currentUser, impersonate } = useAuth();
  const { users, approveUser, rejectUser } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [impersonateModal, setImpersonateModal] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const filtered = users.filter(u => {
    if (filter !== 'ALL' && u.status !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const statusVariant = (s: string) => {
    if (s === 'APPROVED') return 'success';
    if (s === 'PENDING') return 'warning';
    if (s === 'REJECTED') return 'danger';
    return 'default';
  };

  const roleVariant = (r: string) => {
    if (r === 'ADMIN') return 'danger';
    if (r === 'MEMBER_TENANT') return 'info';
    if (r === 'FACILITY_USER') return 'default';
    return 'outline';
  };

  const handleApprove = (id: string, name: string) => {
    approveUser(id);
    toast(`${name} approved`, 'success');
  };

  const handleReject = (id: string, name: string) => {
    rejectUser(id);
    toast(`${name} rejected`, 'warning');
  };

  const handleImpersonate = (userId: string) => {
    impersonate(userId);
    setImpersonateModal(null);
    router.push('/dashboard');
  };

  const impersonateUser = impersonateModal ? users.find(u => u.id === impersonateModal) : null;

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage user accounts and registrations</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
              {f === 'PENDING' && <span className="ml-1 bg-yellow-400 text-yellow-900 rounded-full w-4 h-4 text-xs flex items-center justify-center">{users.filter(u => u.status === 'PENDING').length}</span>}
            </Button>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 ${u.status === 'PENDING' ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0">
                          <span className="text-white text-xs">{u.avatarInitials || u.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{getOrgName(u.orgId)}</td>
                    <td className="px-6 py-4"><Badge variant={roleVariant(u.role) as any}>{u.role.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={statusVariant(u.status) as any}>{u.status}</Badge></td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {u.status === 'PENDING' && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(u.id, u.name)}>
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleReject(u.id, u.name)}>
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {u.status === 'APPROVED' && u.id !== currentUser.id && (
                          <Button variant="outline" size="sm" onClick={() => setImpersonateModal(u.id)}>
                            <Eye className="h-3.5 w-3.5" /> Impersonate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!impersonateModal} onClose={() => setImpersonateModal(null)} title="Impersonate User" size="sm">
        {impersonateUser && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-700">Warning</p>
              <p className="text-sm text-amber-600 mt-1">
                You will temporarily act as <strong>{impersonateUser.name}</strong>. An impersonation banner will be shown. You can exit at any time.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-700">{impersonateUser.name}</p>
              <p className="text-gray-400">{impersonateUser.email}</p>
              <p className="text-gray-400">{getOrgName(impersonateUser.orgId)}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setImpersonateModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={() => handleImpersonate(impersonateUser.id)} className="flex-1">
                <UserCheck className="h-4 w-4" /> Impersonate
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
