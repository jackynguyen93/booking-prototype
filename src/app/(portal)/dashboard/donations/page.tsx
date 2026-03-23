'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DollarSign, Heart, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Donation } from '@/types';

const FREQ_LABEL: Record<string, string> = {
  ONE_OFF: 'one-off',
  MONTHLY: '/month',
  QUARTERLY: '/quarter',
  ANNUAL: '/year',
};

const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PAUSED') return 'warning';
  if (status === 'CANCELLED') return 'danger';
  return 'default';
};

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1e3a5f] text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="text-blue-200 hover:text-white text-lg leading-none">&times;</button>
    </div>
  );
}

export default function DonationsPage() {
  const { currentUser } = useAuth();
  const { donations, updateDonation } = useApp();
  const [activeTab, setActiveTab] = useState<'recurring' | 'receipts'>('recurring');
  const [toast, setToast] = useState<string | null>(null);

  if (!currentUser) return null;

  const myDonations = donations.filter(d => d.orgId === currentUser.orgId);

  const currentYear = new Date().getFullYear().toString();
  const totalThisYear = myDonations
    .filter(d => d.startDate.startsWith(currentYear) || d.status === 'ACTIVE' || d.status === 'PAUSED')
    .reduce((sum, d) => sum + d.amount, 0);

  const activeRecurring = myDonations.filter(
    d => (d.status === 'ACTIVE' || d.status === 'PAUSED') && d.frequency !== 'ONE_OFF'
  );

  const nextPayments = myDonations
    .filter(d => d.status === 'ACTIVE' && d.nextPaymentDate)
    .map(d => d.nextPaymentDate!)
    .sort();
  const nextPayment = nextPayments[0] ? formatDate(nextPayments[0]) : '—';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePause = (donation: Donation) => {
    updateDonation(donation.id, { status: 'PAUSED', nextPaymentDate: undefined });
    showToast(`"${donation.cause}" donation paused.`);
  };

  const handleResume = (donation: Donation) => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    updateDonation(donation.id, {
      status: 'ACTIVE',
      nextPaymentDate: nextDate.toISOString().split('T')[0],
    });
    showToast(`"${donation.cause}" donation resumed.`);
  };

  const handleCancel = (donation: Donation) => {
    updateDonation(donation.id, { status: 'CANCELLED', nextPaymentDate: undefined });
    showToast(`"${donation.cause}" donation cancelled.`);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Donations &amp; Giving</h1>
          <p className="text-gray-500">Manage your recurring donations and download tax receipts.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total Given This Year"
            value={formatCurrency(totalThisYear)}
            icon={<DollarSign className="h-7 w-7" />}
            accentColor="border-green-500"
          />
          <StatsCard
            title="Active Recurring Donations"
            value={activeRecurring.filter(d => d.status === 'ACTIVE').length}
            icon={<Heart className="h-7 w-7" />}
            accentColor="border-pink-500"
          />
          <StatsCard
            title="Next Payment Date"
            value={nextPayment}
            icon={<Calendar className="h-7 w-7" />}
            accentColor="border-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {(['recurring', 'receipts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#1e3a5f] text-[#1e3a5f]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'recurring' ? 'Recurring Donations' : 'Receipt History'}
              </button>
            ))}
          </nav>
        </div>

        {/* Recurring Donations Tab */}
        {activeTab === 'recurring' && (
          <div className="space-y-4">
            {activeRecurring.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-center text-gray-400 py-6">No recurring donations found.</p>
                </CardBody>
              </Card>
            ) : (
              activeRecurring.map(donation => (
                <Card key={donation.id}>
                  <CardBody>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <Heart className="h-5 w-5 text-pink-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{donation.cause}</h3>
                          <p className="text-xl font-bold text-[#1e3a5f] mt-0.5">
                            {formatCurrency(donation.amount)}
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              {FREQ_LABEL[donation.frequency]}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                            <Badge variant={statusVariant(donation.status)}>{donation.status}</Badge>
                            {donation.nextPaymentDate && (
                              <span>Next payment: {formatDate(donation.nextPaymentDate)}</span>
                            )}
                            <span>{donation.paymentMethod}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {donation.status === 'ACTIVE' && (
                          <Button variant="outline" size="sm" onClick={() => handlePause(donation)}>
                            Pause
                          </Button>
                        )}
                        {donation.status === 'PAUSED' && (
                          <Button variant="outline" size="sm" onClick={() => handleResume(donation)}>
                            Resume
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleCancel(donation)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Receipt History Tab */}
        {activeTab === 'receipts' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cause</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myDonations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-gray-400">No donations found.</td>
                    </tr>
                  ) : (
                    myDonations.map(donation => (
                      <tr key={donation.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-600">{formatDate(donation.startDate)}</td>
                        <td className="px-6 py-3 font-medium text-gray-800">{donation.cause}</td>
                        <td className="px-6 py-3 text-gray-700">{formatCurrency(donation.amount)}</td>
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">{donation.receiptNumber}</td>
                        <td className="px-6 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => showToast(`Receipt ${donation.receiptNumber} downloaded.`)}
                          >
                            Download Receipt
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </PortalLayout>
  );
}
