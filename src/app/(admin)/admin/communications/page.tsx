'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { generateId } from '@/lib/utils';
import { Mail, Users, Download, Send } from 'lucide-react';

type Segment = 'All Members' | 'Tenants Only' | 'Facility Users' | 'Donors' | 'All';
type CampaignStatus = 'Sent' | 'Draft';

interface Campaign {
  id: string;
  subject: string;
  segment: Segment;
  sentDate: string;
  recipients: number;
  status: CampaignStatus;
}

const SEGMENT_COUNTS: Record<Segment, number> = {
  'All Members': 24,
  'Tenants Only': 12,
  'Facility Users': 8,
  'Donors': 5,
  'All': 49,
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', subject: 'Welcome to Ross House — March Updates', segment: 'All', sentDate: '2026-03-01', recipients: 49, status: 'Sent' },
  { id: 'c2', subject: 'Tenant Notice: Building Maintenance Schedule', segment: 'Tenants Only', sentDate: '2026-02-20', recipients: 12, status: 'Sent' },
  { id: 'c3', subject: 'Member Networking Event — April 2026', segment: 'All Members', sentDate: '2026-02-15', recipients: 24, status: 'Sent' },
  { id: 'c4', subject: 'Donation Impact Report — Thank You!', segment: 'Donors', sentDate: '2026-01-30', recipients: 5, status: 'Sent' },
  { id: 'c5', subject: 'New Facility Booking System Launch', segment: 'Facility Users', sentDate: '2026-01-10', recipients: 8, status: 'Sent' },
];

const SUBSCRIBER_ROWS: Array<{ segment: Segment; count: number; description: string }> = [
  { segment: 'All Members', count: 24, description: 'Full Ross House Association members' },
  { segment: 'Tenants Only', count: 12, description: 'Commercial and member tenants' },
  { segment: 'Facility Users', count: 8, description: 'External facility booking users' },
  { segment: 'Donors', count: 5, description: 'Regular donors and supporters' },
];

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

export default function CommunicationsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'subscribers'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [showComposer, setShowComposer] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: '', segment: 'All' as Segment, body: '' });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const totalSubscribers = SUBSCRIBER_ROWS.reduce((sum, r) => sum + r.count, 0);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.body) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));

    const recipientCount = SEGMENT_COUNTS[form.segment];
    const newCampaign: Campaign = {
      id: generateId(),
      subject: form.subject,
      segment: form.segment,
      sentDate: new Date().toISOString().split('T')[0],
      recipients: recipientCount,
      status: 'Sent',
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    setSending(false);
    setShowComposer(false);
    setForm({ subject: '', segment: 'All', body: '' });
    toast(`Campaign sent to ${recipientCount} recipients`, 'success');
  };

  const handleExport = (segment: Segment, count: number) => {
    toast(`Exporting ${segment} list (${count} subscribers)...`, 'info');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-gray-500">Compose and send segmented email campaigns; manage subscriber lists</p>
          </div>
          {activeTab === 'campaigns' && (
            <Button onClick={() => setShowComposer(true)}>
              <Mail className="h-4 w-4" />
              New Campaign
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['campaigns', 'subscribers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Campaign History</h2>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Segment</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sent Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Recipients</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No campaigns yet</td>
                    </tr>
                  ) : campaigns.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{c.subject}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info">{c.segment}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(c.sentDate)}</td>
                      <td className="px-6 py-4 text-gray-700 text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {c.recipients}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={c.status === 'Sent' ? 'success' : 'default'}>{c.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-[#1e3a5f]">{totalSubscribers}</p>
                <p className="text-sm text-gray-500 mt-1">Total Subscribers</p>
              </div>
              {SUBSCRIBER_ROWS.map(row => (
                <div key={row.segment} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-[#1e3a5f]">{row.count}</p>
                  <p className="text-sm text-gray-500 mt-1">{row.segment}</p>
                </div>
              ))}
            </div>

            {/* Subscriber table */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Subscriber Segments</h2>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Segment</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Share</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUBSCRIBER_ROWS.map(row => (
                      <tr key={row.segment} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{row.segment}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{row.description}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#1e3a5f]">{row.count}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
                              <div
                                className="h-full bg-[#1e3a5f] rounded-full"
                                style={{ width: `${(row.count / totalSubscribers) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round((row.count / totalSubscribers) * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm" onClick={() => handleExport(row.segment, row.count)}>
                            <Download className="h-3.5 w-3.5" />
                            Export List
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Composer Modal */}
      <Modal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        title="New Campaign"
        size="xl"
      >
        <form onSubmit={handleSendCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Important update from Ross House Association"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Segment</label>
            <select
              value={form.segment}
              onChange={e => setForm(p => ({ ...p, segment: e.target.value as Segment }))}
              className={inputClass}
            >
              <option value="All">All ({SEGMENT_COUNTS['All']} recipients)</option>
              <option value="All Members">All Members ({SEGMENT_COUNTS['All Members']} recipients)</option>
              <option value="Tenants Only">Tenants Only ({SEGMENT_COUNTS['Tenants Only']} recipients)</option>
              <option value="Facility Users">Facility Users ({SEGMENT_COUNTS['Facility Users']} recipients)</option>
              <option value="Donors">Donors ({SEGMENT_COUNTS['Donors']} recipients)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body <span className="text-red-500">*</span></label>
            <textarea
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              rows={10}
              placeholder="Write your message here..."
              className={inputClass}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-700">
            <Send className="h-4 w-4 inline mr-1.5 mb-0.5" />
            This will send to <strong>{SEGMENT_COUNTS[form.segment]} recipients</strong> in the <strong>{form.segment}</strong> segment.
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowComposer(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={sending} className="flex-1">
              <Send className="h-4 w-4" />
              Send Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
