'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockDocuments } from '@/data/documents';
import { formatDate } from '@/lib/utils';
import { FileText, Download, Lock, Building2 } from 'lucide-react';
import { DocumentCategory } from '@/types';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';

const categories: { value: DocumentCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Documents' },
  { value: 'NEWSLETTER', label: 'Newsletters' },
  { value: 'ANNUAL_REPORT', label: 'Annual Reports' },
  { value: 'POLICY', label: 'Policies' },
  { value: 'HOUSE_RULES', label: 'House Rules' },
];

const categoryBadge = (cat: DocumentCategory) => {
  const map: Record<string, { label: string; variant: string }> = {
    NEWSLETTER: { label: 'Newsletter', variant: 'info' },
    ANNUAL_REPORT: { label: 'Annual Report', variant: 'success' },
    POLICY: { label: 'Policy', variant: 'warning' },
    HOUSE_RULES: { label: 'House Rules', variant: 'default' },
  };
  return map[cat] || { label: cat, variant: 'default' };
};

const mockLeaseDocuments = [
  { id: 'lease1', title: 'Current Lease Agreement', description: 'Your current tenancy agreement', date: '2024-01-01', fileSize: '1.4 MB' },
  { id: 'lease2', title: 'Lease Renewal Notice 2026', description: 'Renewal terms and conditions', date: '2025-11-01', fileSize: '0.5 MB' },
  { id: 'lease3', title: 'Bond / Security Deposit Receipt', description: 'Bond payment confirmation', date: '2024-01-10', fileSize: '0.2 MB' },
];

export default function DocumentsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<DocumentCategory | 'ALL'>('ALL');
  const isTenant = currentUser ? ['MEMBER_TENANT', 'COMMERCIAL_TENANT'].includes(currentUser.role) : false;

  if (!currentUser) return null;

  const filtered = mockDocuments.filter(doc => {
    if (activeTab !== 'ALL' && doc.category !== activeTab) return false;
    return true;
  });

  const canAccess = (doc: typeof mockDocuments[0]) => {
    if (!doc.gated) return true;
    if (!doc.allowedRoles) return true;
    return doc.allowedRoles.includes(currentUser.role);
  };

  const handleDownload = (doc: typeof mockDocuments[0]) => {
    if (!canAccess(doc)) {
      toast('You do not have permission to access this document', 'error');
      return;
    }
    toast(`Downloading ${doc.title}...`, 'success');
  };

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500">Newsletters, reports, policies, and house rules</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveTab(cat.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === cat.value
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {cat.label}
              <span className="ml-1.5 text-xs text-gray-400">
                ({mockDocuments.filter(d => cat.value === 'ALL' || d.category === cat.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Lease / Tenancy Documents — only for tenant roles */}
        {isTenant && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1e3a5f]" />
              <h2 className="font-semibold text-gray-900">Your Tenancy Documents</h2>
            </div>
            {mockLeaseDocuments.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border border-[#1e3a5f]/20 shadow-sm p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.description} · {formatDate(doc.date)} · {doc.fileSize}</p>
                </div>
                <button
                  onClick={() => toast(`Downloading ${doc.title}...`, 'success')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] text-sm font-medium hover:bg-[#1e3a5f] hover:text-white transition-colors shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Documents list */}
        <div className="space-y-3">
          {filtered.map(doc => {
            const accessible = canAccess(doc);
            const badge = categoryBadge(doc.category);
            return (
              <Card key={doc.id} className={!accessible ? 'opacity-70' : ''}>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${accessible ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      {accessible ? <FileText className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${accessible ? 'text-gray-900' : 'text-gray-500'}`}>{doc.title}</p>
                        {!accessible && <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant={badge.variant as any}>{badge.label}</Badge>
                        <span className="text-xs text-gray-400">{formatDate(doc.date)}</span>
                        <span className="text-xs text-gray-400">{doc.fileSize}</span>
                      </div>
                      {!accessible && (
                        <p className="text-xs text-gray-400 mt-1">
                          Access restricted — available to {doc.allowedRoles?.join(', ').replace(/_/g, ' ') || 'authorised users'}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={accessible ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={!accessible}
                    >
                      <Download className="h-4 w-4" />
                      {accessible ? 'Download' : 'Restricted'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </PortalLayout>
  );
}
