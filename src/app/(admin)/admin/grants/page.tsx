'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';
import { GrantApplication, Notification } from '@/types';
import { Award, CheckCircle, Clock, XCircle, AlertCircle, Eye } from 'lucide-react';

type StatusFilter = 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

const statusConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'danger' | 'default'; icon: React.ReactNode }> = {
  SUBMITTED: { label: 'Submitted', variant: 'info', icon: <Clock className="h-3.5 w-3.5" /> },
  UNDER_REVIEW: { label: 'Under Review', variant: 'warning', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  APPROVED: { label: 'Approved', variant: 'success', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REJECTED: { label: 'Rejected', variant: 'danger', icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function AdminGrantsPage() {
  const { currentUser } = useAuth();
  const { grantApplications, organisations, updateGrantApplication, addNotification } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const getOrgName = (orgId: string) => organisations.find(o => o.id === orgId)?.name || orgId;

  const filtered = grantApplications
    .filter(a => statusFilter === 'ALL' || a.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts: Record<StatusFilter, number> = {
    ALL: grantApplications.length,
    SUBMITTED: grantApplications.filter(a => a.status === 'SUBMITTED').length,
    UNDER_REVIEW: grantApplications.filter(a => a.status === 'UNDER_REVIEW').length,
    APPROVED: grantApplications.filter(a => a.status === 'APPROVED').length,
    REJECTED: grantApplications.filter(a => a.status === 'REJECTED').length,
  };

  const handleReview = (app: GrantApplication) => {
    updateGrantApplication(app.id, { status: 'UNDER_REVIEW', updatedAt: new Date().toISOString() });
    toast(`Grant application from ${getOrgName(app.orgId)} marked as Under Review`, 'info');
  };

  const handleApprove = (app: GrantApplication) => {
    updateGrantApplication(app.id, { status: 'APPROVED', updatedAt: new Date().toISOString() });
    const notif: Notification = {
      id: generateId(),
      userId: app.userId,
      type: 'GENERAL',
      title: 'Grant Application Approved',
      body: `Your grant application for ${formatCurrency(app.amountRequested)} has been approved by Ross House Association. We will be in touch to arrange disbursement.`,
      read: false,
      createdAt: new Date().toISOString(),
      link: '/dashboard/grants',
    };
    addNotification(notif);
    toast(`Grant application approved — notification sent to user`, 'success');
  };

  const handleReject = (app: GrantApplication) => {
    updateGrantApplication(app.id, { status: 'REJECTED', updatedAt: new Date().toISOString() });
    const notif: Notification = {
      id: generateId(),
      userId: app.userId,
      type: 'GENERAL',
      title: 'Grant Application Unsuccessful',
      body: `Thank you for your grant application for ${formatCurrency(app.amountRequested)}. Unfortunately this application was not approved at this time. Please contact the office for more information.`,
      read: false,
      createdAt: new Date().toISOString(),
      link: '/dashboard/grants',
    };
    addNotification(notif);
    toast(`Grant application rejected — notification sent to user`, 'warning');
  };

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grant Applications</h1>
          <p className="text-gray-500">Review and manage grant applications from member organisations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.SUBMITTED}</p>
            <p className="text-xs text-blue-600 font-medium mt-0.5">Awaiting Review</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.UNDER_REVIEW}</p>
            <p className="text-xs text-yellow-600 font-medium mt-0.5">Under Review</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.APPROVED}</p>
            <p className="text-xs text-green-600 font-medium mt-0.5">Approved</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.REJECTED}</p>
            <p className="text-xs text-red-600 font-medium mt-0.5">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.key
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label} {counts[f.key] > 0 && <span className="ml-1 opacity-75">({counts[f.key]})</span>}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <Award className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400">No applications match this filter.</p>
                    </td>
                  </tr>
                ) : filtered.map(app => {
                  const config = statusConfig[app.status];
                  return (
                    <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{getOrgName(app.orgId)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 text-xs">{app.purpose || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell max-w-xs">
                        <p className="text-gray-600 text-xs truncate" title={app.description}>{app.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">{formatCurrency(app.amountRequested)}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-gray-500 text-xs">{formatDate(app.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={config.variant}>
                          <span className="flex items-center gap-1">
                            {config.icon}
                            {config.label}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {app.status === 'SUBMITTED' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReview(app)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Review
                            </Button>
                          )}
                          {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(app)}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() => handleReject(app)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </>
                          )}
                          {(app.status === 'APPROVED' || app.status === 'REJECTED') && (
                            <span className="text-xs text-gray-400 italic">No actions available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
