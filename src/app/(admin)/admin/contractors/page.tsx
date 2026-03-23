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
import { HardHat, LogOut, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

type Trade = 'Electrician' | 'Plumber' | 'IT Support' | 'Cleaner' | 'HVAC' | 'Fire Safety' | 'Lift Technician' | 'Other';
type Area = 'Ground Floor' | 'Level 1' | 'Level 2' | 'Roof Access' | 'Basement';

const TRADES: Trade[] = ['Electrician', 'Plumber', 'IT Support', 'Cleaner', 'HVAC', 'Fire Safety', 'Lift Technician', 'Other'];
const AREAS: Area[] = ['Ground Floor', 'Level 1', 'Level 2', 'Roof Access', 'Basement'];

interface ContractorEntry {
  id: string;
  name: string;
  company: string;
  trade: Trade;
  phone: string;
  areas: Area[];
  expectedDuration: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

const MOCK_HISTORY: ContractorEntry[] = [
  { id: 'ct1', name: 'James Wu', company: 'CityElec Solutions', trade: 'Electrician', phone: '0412 345 678', areas: ['Level 2', 'Basement'], expectedDuration: '3 hours', date: '2026-03-20', timeIn: '08:30', timeOut: '11:15' },
  { id: 'ct2', name: 'Maria Santos', company: 'AquaFix Plumbing', trade: 'Plumber', phone: '0423 456 789', areas: ['Ground Floor', 'Level 1'], expectedDuration: '2 hours', date: '2026-03-19', timeIn: '10:00', timeOut: '12:00' },
  { id: 'ct3', name: 'Derek Pham', company: 'CleanCo Services', trade: 'Cleaner', phone: '0434 567 890', areas: ['Ground Floor', 'Level 1', 'Level 2'], expectedDuration: '4 hours', date: '2026-03-18', timeIn: '07:00', timeOut: '11:00' },
  { id: 'ct4', name: 'Sandra Lee', company: 'TechSupport Pro', trade: 'IT Support', phone: '0445 678 901', areas: ['Level 1', 'Level 2'], expectedDuration: '2 hours', date: '2026-03-17', timeIn: '13:00', timeOut: '15:30' },
  { id: 'ct5', name: 'Tom Baker', company: 'AirFlow HVAC', trade: 'HVAC', phone: '0456 789 012', areas: ['Roof Access', 'Basement'], expectedDuration: '5 hours', date: '2026-03-15', timeIn: '09:00', timeOut: '14:00' },
  { id: 'ct6', name: 'Priya Kapoor', company: 'FireSafe Systems', trade: 'Fire Safety', phone: '0467 890 123', areas: ['Ground Floor', 'Level 1', 'Level 2', 'Basement'], expectedDuration: '6 hours', date: '2026-03-10', timeIn: '08:00', timeOut: '14:30' },
];

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

export default function ContractorsPage() {
  const { currentUser } = useAuth();
  const [activeContractors, setActiveContractors] = useState<ContractorEntry[]>([]);
  const [history, setHistory] = useState<ContractorEntry[]>(MOCK_HISTORY);
  const [showSignIn, setShowSignIn] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    company: '',
    trade: 'Electrician' as Trade,
    phone: '',
    areas: [] as Area[],
    expectedDuration: '',
  });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const timeStr = format(now, 'HH:mm');

  const toggleArea = (area: Area) => {
    setForm(prev => ({
      ...prev,
      areas: prev.areas.includes(area) ? prev.areas.filter(a => a !== area) : [...prev.areas, area],
    }));
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company || form.areas.length === 0) {
      toast('Please fill in all required fields and select at least one area', 'error');
      return;
    }

    const entry: ContractorEntry = {
      id: generateId(),
      ...form,
      date: todayStr,
      timeIn: format(new Date(), 'HH:mm'),
      timeOut: null,
    };
    setActiveContractors(prev => [entry, ...prev]);
    setShowSignIn(false);
    setForm({ name: '', company: '', trade: 'Electrician', phone: '', areas: [], expectedDuration: '' });
    toast(`${entry.name} signed in successfully`, 'success');
  };

  const handleSignOut = (id: string) => {
    const contractor = activeContractors.find(c => c.id === id);
    if (!contractor) return;
    const signedOut = { ...contractor, timeOut: format(new Date(), 'HH:mm') };
    setActiveContractors(prev => prev.filter(c => c.id !== id));
    setHistory(prev => [signedOut, ...prev]);
    toast(`${contractor.name} signed out at ${signedOut.timeOut}`, 'success');
  };

  const filteredHistory = dateFilter
    ? history.filter(h => h.date === dateFilter)
    : history;

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contractor Sign-In Register</h1>
            <p className="text-gray-500">Digital sign-in system — replacing the paper folder at reception</p>
          </div>
          <Button onClick={() => setShowSignIn(true)}>
            <HardHat className="h-4 w-4" />
            Sign In Contractor
          </Button>
        </div>

        {/* Active contractors */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Currently On-Site
            {activeContractors.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-full text-xs font-bold">
                {activeContractors.length}
              </span>
            )}
          </h2>
          {activeContractors.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-6">
                  <HardHat className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No contractors currently on-site</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeContractors.map(c => (
                <Card key={c.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-full flex items-center justify-center shrink-0">
                          <HardHat className="h-5 w-5 text-[#1e3a5f]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.company}</p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                      <div className="flex gap-2"><span className="font-medium text-gray-600 w-16">Trade:</span>{c.trade}</div>
                      <div className="flex gap-2"><span className="font-medium text-gray-600 w-16">Time In:</span>{c.timeIn}</div>
                      <div className="flex gap-2"><span className="font-medium text-gray-600 w-16">Duration:</span>{c.expectedDuration}</div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="font-medium text-gray-600 w-16">Areas:</span>
                        <span>{c.areas.join(', ')}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button variant="secondary" size="sm" className="w-full" onClick={() => handleSignOut(c.id)}>
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Sign-In History</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Filter by date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
              {dateFilter && (
                <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>Clear</Button>
              )}
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trade</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time In</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time Out</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Areas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                        <ClipboardList className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        No sign-in records found
                      </td>
                    </tr>
                  ) : filteredHistory.map(entry => (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800 text-sm">{entry.name}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{entry.company}</td>
                      <td className="px-6 py-3">
                        <Badge variant="info">{entry.trade}</Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(entry.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 text-gray-700 text-sm font-mono">{entry.timeIn}</td>
                      <td className="px-6 py-3 text-sm font-mono">
                        {entry.timeOut
                          ? <span className="text-gray-700">{entry.timeOut}</span>
                          : <Badge variant="warning">Active</Badge>
                        }
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{entry.areas.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Sign-In Modal */}
      <Modal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        title="Sign In Contractor"
        size="lg"
      >
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                placeholder="Company / business name"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade / Purpose</label>
              <select
                value={form.trade}
                onChange={e => setForm(p => ({ ...p, trade: e.target.value as Trade }))}
                className={inputClass}
              >
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="04xx xxx xxx"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Areas Accessing <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(area => (
                <label key={area} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.areas.includes(area)}
                    onChange={() => toggleArea(area)}
                    className="rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                  />
                  <span className="text-sm text-gray-700">{area}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Duration</label>
            <input
              type="text"
              value={form.expectedDuration}
              onChange={e => setForm(p => ({ ...p, expectedDuration: e.target.value }))}
              placeholder="e.g. 2 hours, Half day"
              className={inputClass}
            />
          </div>

          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600 space-y-1">
            <div className="flex gap-3"><span className="font-medium w-20">Date:</span>{format(now, 'dd MMM yyyy')}</div>
            <div className="flex gap-3"><span className="font-medium w-20">Time In:</span>{timeStr} (auto-filled)</div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowSignIn(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              <HardHat className="h-4 w-4" />
              Sign In
            </Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
