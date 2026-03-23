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
import { generateId } from '@/lib/utils';
import { mockOrganisations } from '@/data/organisations';
import { Monitor, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type Duration = '1' | '2';

interface DisplayRequest {
  id: string;
  orgName: string;
  startDate: string;
  duration: Duration;
  title: string;
  description: string;
  status: RequestStatus;
  submittedAt: string;
}

// Weeks that are already booked (ISO week start dates YYYY-MM-DD Monday)
const bookedWeekStarts: string[] = [
  '2026-03-16',
  '2026-03-23',
  '2026-04-06',
  '2026-04-20',
  '2026-05-04',
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekBooked(monday: Date): boolean {
  const isoMonday = toISO(monday);
  return bookedWeekStarts.includes(isoMonday);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeeksInMonth(year: number, month: number): Date[] {
  // Returns the Monday of each week that has days in this month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: Date[] = [];
  let current = getMonday(firstDay);
  while (current <= lastDay) {
    weeks.push(new Date(current));
    current = addDays(current, 7);
  }
  return weeks;
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('en-AU', opts)} – ${sunday.toLocaleDateString('en-AU', opts)}`;
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const statusConfig: Record<RequestStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  APPROVED: { label: 'Approved', variant: 'success' },
  PENDING: { label: 'Pending Review', variant: 'warning' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

export default function WindowDisplayPage() {
  const { currentUser } = useAuth();
  const { organisations } = useApp();

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const orgName = (organisations.find(o => o.id === currentUser?.orgId) ||
    mockOrganisations.find(o => o.id === currentUser?.orgId))?.name || '';

  const [form, setForm] = useState({
    startDate: '',
    duration: '1' as Duration,
    title: '',
    description: '',
    orgName: orgName,
  });
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState<DisplayRequest[]>([
    {
      id: 'wr-1',
      orgName: orgName || 'My Organisation',
      startDate: '2026-02-23',
      duration: '2',
      title: 'Women\'s Health Awareness Month',
      description: 'Display raising awareness for women\'s health services available in Melbourne.',
      status: 'APPROVED',
      submittedAt: '2026-02-10T09:30:00Z',
    },
    {
      id: 'wr-2',
      orgName: orgName || 'My Organisation',
      startDate: '2026-04-27',
      duration: '1',
      title: 'National Volunteer Week Celebration',
      description: 'Celebrating our amazing volunteers with a display honouring their contributions.',
      status: 'PENDING',
      submittedAt: '2026-03-18T14:00:00Z',
    },
  ]);

  if (!currentUser) return null;

  const monthName = new Date(calYear, calMonth).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  const weeks = getWeeksInMonth(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.title || !form.description) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const req: DisplayRequest = {
      id: generateId(),
      orgName: form.orgName || orgName,
      startDate: form.startDate,
      duration: form.duration,
      title: form.title,
      description: form.description,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    setRequests(prev => [req, ...prev]);
    setForm(prev => ({ ...prev, startDate: '', duration: '1', title: '', description: '' }));
    setSubmitting(false);
    toast('Display request submitted successfully', 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Foyer Window Display</h1>
            <p className="text-gray-500 mt-0.5">
              Request a slot to display your organisation&apos;s materials in the main foyer window.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Calendar + Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Availability Calendar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Availability</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">{monthName}</span>
                    <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-2">
                <div className="flex gap-4 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-[#1e3a5f]" /> Booked
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-green-500" /> Available
                  </div>
                </div>
                <div className="space-y-2">
                  {weeks.map(monday => {
                    const booked = isWeekBooked(monday);
                    return (
                      <div
                        key={toISO(monday)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                          booked
                            ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
                            : 'bg-green-50 border-green-200 text-green-800'
                        }`}
                      >
                        <span className="text-sm font-medium">Week of {formatWeekRange(monday)}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          booked ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                        }`}>
                          {booked ? 'Booked' : 'Available'}
                        </span>
                      </div>
                    );
                  })}
                  {weeks.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No weeks to display</p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Request Form */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Submit a Request</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fill in the form below to request a display slot</p>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                        className={inputClass}
                        required
                        min={toISO(today)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <select
                        value={form.duration}
                        onChange={e => setForm(p => ({ ...p, duration: e.target.value as Duration }))}
                        className={inputClass}
                      >
                        <option value="1">1 week</option>
                        <option value="2">2 weeks</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Title / Theme <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Mental Health Awareness Week"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description of Display <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={3}
                      placeholder="Briefly describe what you plan to display..."
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
                    <input
                      type="text"
                      value={form.orgName}
                      onChange={e => setForm(p => ({ ...p, orgName: e.target.value }))}
                      className={`${inputClass} bg-gray-50`}
                    />
                  </div>
                  <div className="pt-2">
                    <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                      Submit Request
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Right column: My Requests */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">My Requests</h2>
              </CardHeader>
              <div className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <CardBody className="text-center py-8">
                    <Monitor className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No requests yet</p>
                  </CardBody>
                ) : requests.map(req => {
                  const cfg = statusConfig[req.status];
                  return (
                    <div key={req.id} className="px-6 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{req.title}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p className="flex items-center gap-1">
                          {req.status === 'APPROVED'
                            ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            : <Clock className="h-3.5 w-3.5 text-orange-400" />
                          }
                          {formatDisplayDate(req.startDate)} · {req.duration} week{req.duration === '2' ? 's' : ''}
                        </p>
                        <p className="text-gray-400">Submitted {formatDisplayDate(req.submittedAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Help note */}
            <Card>
              <CardBody className="text-sm text-gray-600 space-y-2">
                <p className="font-medium text-gray-900">Guidelines</p>
                <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside">
                  <li>Slots are allocated on a first-come, first-served basis</li>
                  <li>Each organisation may hold up to 2 slots per quarter</li>
                  <li>Displays must align with Ross House community values</li>
                  <li>Physical materials must be delivered to reception at least 2 days prior</li>
                  <li>Requests are reviewed within 3 business days</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
