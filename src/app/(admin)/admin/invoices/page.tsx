'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { mockOrganisations } from '@/data/organisations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { Download, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import { Invoice } from '@/types';
import { mockInvoices as rawInvoices } from '@/data/invoices';

export default function AdminInvoicesPage() {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>(rawInvoices);
  const [syncLoading, setSyncLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [chargeModal, setChargeModal] = useState(false);
  const [chargeForm, setChargeForm] = useState({ orgId: 'org2', description: '', amount: '' });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const statusVariant = (s: string) => {
    if (s === 'PAID') return 'success';
    if (s === 'OVERDUE') return 'danger';
    return 'warning';
  };

  const filtered = statusFilter === 'ALL'
    ? invoices
    : invoices.filter(i => i.status === statusFilter);

  const handleXeroSync = async () => {
    setSyncLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setSyncLoading(false);
    toast('Syncing to Xero... 5 invoices queued for synchronisation', 'info');
    await new Promise(r => setTimeout(r, 800));
    toast('Xero sync completed successfully', 'success');
  };

  const handleMarkPaid = (inv: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'PAID' as const } : i));
    toast(`Invoice ${inv.invoiceNumber} marked as paid`, 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  const totalOutstanding = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);
  const overdueCt = invoices.filter(i => i.status === 'OVERDUE').length;

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500">
              Outstanding: {formatCurrency(totalOutstanding)}
              {overdueCt > 0 && <span className="ml-2 text-red-500 font-medium">· {overdueCt} overdue</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setChargeModal(true)}>
              <Plus className="h-4 w-4" /> Manual Charge
            </Button>
            <Button loading={syncLoading} onClick={handleXeroSync}>
              <RefreshCw className="h-4 w-4" /> Xero Sync
            </Button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(f => (
            <Button key={f} variant={statusFilter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setStatusFilter(f)}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              {f === 'OVERDUE' && overdueCt > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">{overdueCt}</span>
              )}
            </Button>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No invoices found</td></tr>
                ) : filtered.map(inv => (
                  <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50 ${inv.status === 'OVERDUE' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{getOrgName(inv.orgId)}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{inv.period}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-4"><Badge variant={statusVariant(inv.status) as any}>{inv.status}</Badge></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {inv.status !== 'PAID' && (
                          <Button size="sm" onClick={() => handleMarkPaid(inv)}>
                            <CheckCircle className="h-3.5 w-3.5" /> Mark Paid
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => toast('Downloading invoice PDF...', 'info')}>
                          <Download className="h-3.5 w-3.5" /> PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Manual Charge Modal */}
      <Modal isOpen={chargeModal} onClose={() => setChargeModal(false)} title="Add Manual Charge" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Organisation</label>
            <select value={chargeForm.orgId} onChange={e => setChargeForm(p => ({ ...p, orgId: e.target.value }))} className={inputClass}>
              {mockOrganisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <input type="text" value={chargeForm.description} onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Key replacement fee" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount (AUD)</label>
            <input type="number" value={chargeForm.amount} onChange={e => setChargeForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" min="0" step="0.01" className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setChargeModal(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => {
                if (!chargeForm.description || !chargeForm.amount) {
                  toast('Please fill in all fields', 'error');
                  return;
                }
                setChargeModal(false);
                setChargeForm({ orgId: 'org2', description: '', amount: '' });
                toast('Manual charge added to next invoice', 'success');
              }}
              className="flex-1"
            >
              Add Charge
            </Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
