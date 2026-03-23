'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { mockInvoices } from '@/data/invoices';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { Download, CreditCard, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

export default function InvoicesPage() {
  const { currentUser } = useAuth();
  const [payModal, setPayModal] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!currentUser) return null;

  // Check tenant access
  if (!['MEMBER_TENANT', 'COMMERCIAL_TENANT', 'ADMIN'].includes(currentUser.role)) {
    return (
      <PortalLayout>
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-600">Invoices are only available to tenant organisations.</p>
        </div>
      </PortalLayout>
    );
  }

  const myInvoices = mockInvoices.filter(i => i.orgId === currentUser.orgId);
  const payingInvoice = payModal ? myInvoices.find(i => i.id === payModal) : null;

  const statusVariant = (s: string) => {
    if (s === 'PAID') return 'success';
    if (s === 'OVERDUE') return 'danger';
    return 'warning';
  };

  const handlePay = async () => {
    setPaying(true);
    await new Promise(r => setTimeout(r, 1200));
    setPaying(false);
    setPayModal(null);
    toast('Payment processed successfully!', 'success');
  };

  const totalOutstanding = myInvoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500">View and pay your organisation&apos;s invoices</p>
          </div>
          {totalOutstanding > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              Outstanding: <strong>{formatCurrency(totalOutstanding)}</strong>
            </div>
          )}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Issued</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myInvoices.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No invoices found</td></tr>
                ) : myInvoices.flatMap(inv => {
                  const rows = [
                    <tr
                      key={inv.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${inv.status === 'OVERDUE' ? 'bg-red-50/30' : ''}`}
                      onClick={() => toggleRow(inv.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {expandedRows.has(inv.id)
                            ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                            : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                          <span className="font-mono text-sm font-medium text-gray-900">{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{inv.period}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(inv.amount)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(inv.issuedDate)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4"><Badge variant={statusVariant(inv.status) as any}>{inv.status}</Badge></td>
                      <td className="px-6 py-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toast('Downloading invoice PDF...', 'info')}>
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </Button>
                          {inv.status !== 'PAID' && (
                            <Button variant="primary" size="sm" onClick={() => setPayModal(inv.id)}>
                              <CreditCard className="h-3.5 w-3.5" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ];
                  if (expandedRows.has(inv.id)) {
                    rows.push(
                      <tr key={`${inv.id}-items`} className="bg-gray-50">
                        <td colSpan={7} className="px-10 py-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Line Items</p>
                          <div className="space-y-1">
                            {inv.lineItems.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                <span className="text-gray-600">{item.description}</span>
                                <span className="font-medium text-gray-800">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Pay Invoice">
        {payingInvoice && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-mono text-sm font-medium text-gray-700">{payingInvoice.invoiceNumber}</p>
              <p className="text-sm text-gray-500">{payingInvoice.period}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(payingInvoice.amount)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Line Items</p>
              {payingInvoice.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-600">{item.description}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Payment Method</p>
              <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Card number" className="col-span-2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  <input type="text" placeholder="MM/YY" className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                  <input type="text" placeholder="CVV" className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <p className="text-xs text-gray-400">This is a mock payment form — no real transaction will occur.</p>
              </div>
            </div>
            <Button onClick={handlePay} loading={paying} className="w-full" size="lg">
              Pay {formatCurrency(payingInvoice.amount)}
            </Button>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
