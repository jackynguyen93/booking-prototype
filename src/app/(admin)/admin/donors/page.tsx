'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import {
  Search, ChevronDown, ChevronRight, Download, Plus,
  Heart, Users, DollarSign, TrendingUp, ArrowRight, StickyNote,
} from 'lucide-react';

// ─── Pipeline types ───────────────────────────────────────────────────────────
type PipelineStage = 'PROSPECT' | 'ENGAGED' | 'ACTIVE_DONOR' | 'LAPSED';

interface PipelineCard {
  id: string;
  name: string;
  org: string;
  estimatedValue: number;
  lastContact: string;
  stage: PipelineStage;
  notes?: string;
}

interface ContactNote {
  contactId: string;
  text: string;
  timestamp: string;
}

// ─── Mock pipeline data ───────────────────────────────────────────────────────
const INITIAL_PIPELINE: PipelineCard[] = [
  { id: 'p1', name: 'David Hartley',     org: 'Hartley Foundation',       estimatedValue: 5000,  lastContact: '2026-03-10', stage: 'PROSPECT'     },
  { id: 'p2', name: 'Lena Vo',           org: 'Mekong Futures Inc',        estimatedValue: 2000,  lastContact: '2026-02-28', stage: 'PROSPECT'     },
  { id: 'p3', name: 'Robert Chambers',   org: 'Chambers Family Trust',     estimatedValue: 10000, lastContact: '2026-03-01', stage: 'ENGAGED'      },
  { id: 'p4', name: 'Priya Sharma',      org: 'Future Seeds Philanthropy', estimatedValue: 3500,  lastContact: '2026-03-15', stage: 'ENGAGED'      },
  { id: 'p5', name: 'Catherine Nguyen',  org: 'Green Partners',            estimatedValue: 7200,  lastContact: '2026-03-18', stage: 'ACTIVE_DONOR' },
  { id: 'p6', name: 'Tony Breslin',      org: 'Breslin & Co',              estimatedValue: 4800,  lastContact: '2026-01-20', stage: 'ACTIVE_DONOR' },
  { id: 'p7', name: 'Sylvia Tan',        org: 'Tan Community Trust',       estimatedValue: 1500,  lastContact: '2025-11-05', stage: 'LAPSED'       },
  { id: 'p8', name: 'Marcus Webb',       org: 'Webb Capital',              estimatedValue: 8000,  lastContact: '2025-10-12', stage: 'LAPSED'       },
];

const STAGE_ORDER: PipelineStage[] = ['PROSPECT', 'ENGAGED', 'ACTIVE_DONOR', 'LAPSED'];
const STAGE_LABELS: Record<PipelineStage, string> = {
  PROSPECT:     'Prospect',
  ENGAGED:      'Engaged',
  ACTIVE_DONOR: 'Active Donor',
  LAPSED:       'Lapsed',
};
const STAGE_COLORS: Record<PipelineStage, string> = {
  PROSPECT:     'border-t-blue-400',
  ENGAGED:      'border-t-amber-400',
  ACTIVE_DONOR: 'border-t-green-500',
  LAPSED:       'border-t-gray-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function periodMultiplier(freq: string): number {
  if (freq === 'MONTHLY')   return 12;
  if (freq === 'QUARTERLY') return 4;
  if (freq === 'ANNUAL')    return 1;
  return 1; // ONE_OFF
}

function donationStatusVariant(s: string) {
  if (s === 'ACTIVE')    return 'success';
  if (s === 'PAUSED')    return 'warning';
  if (s === 'COMPLETED') return 'info';
  if (s === 'CANCELLED') return 'danger';
  return 'default';
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDonorsPage() {
  const { currentUser } = useAuth();
  const { users, organisations, donations } = useApp();

  // Tabs
  const [activeTab, setActiveTab] = useState<'contacts' | 'contributions' | 'pipeline'>('contacts');

  // Contacts tab state
  const [contactSearch, setContactSearch] = useState('');
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ userId: string; name: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);

  // Contributions tab state
  const [contribFilter, setContribFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ALL');

  // Pipeline tab state
  const [pipeline, setPipeline] = useState<PipelineCard[]>(INITIAL_PIPELINE);
  const [prospectModal, setProspectModal] = useState(false);
  const [prospectForm, setProspectForm] = useState({ name: '', org: '', estimatedValue: '', notes: '' });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  // ── Derived data ────────────────────────────────────────────────────────────
  const donorUsers = users.filter(u => u.role === 'DONOR_PARTNER');

  const getOrg = (orgId: string) => organisations.find(o => o.id === orgId);
  const getUser = (userId: string) => users.find(u => u.id === userId);

  const totalGiven = (userId: string) =>
    donations
      .filter(d => d.userId === userId)
      .reduce((sum, d) => sum + d.amount * periodMultiplier(d.frequency), 0);

  const lastActivity = (userId: string) => {
    const userDonations = donations.filter(d => d.userId === userId);
    if (!userDonations.length) return '—';
    const latest = userDonations.reduce((a, b) => (a.startDate > b.startDate ? a : b));
    return formatDate(latest.startDate);
  };

  // Contacts filtered
  const filteredContacts = donorUsers.filter(u => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  // Contributions filtered
  const filteredDonations = donations.filter(d =>
    contribFilter === 'ALL' ? true : d.status === contribFilter
  );

  // Summary stats
  const totalContributed = donations.reduce((sum, d) => sum + d.amount * periodMultiplier(d.frequency), 0);
  const activeMonthly = donations
    .filter(d => d.status === 'ACTIVE' && d.frequency === 'MONTHLY')
    .reduce((sum, d) => sum + d.amount, 0);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveNote = () => {
    if (!noteModal || !noteText.trim()) return;
    setContactNotes(prev => [
      ...prev,
      { contactId: noteModal.userId, text: noteText.trim(), timestamp: new Date().toISOString() },
    ]);
    toast(`Note saved for ${noteModal.name}`, 'success');
    setNoteText('');
    setNoteModal(null);
  };

  const handleMoveStage = (cardId: string) => {
    setPipeline(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const idx = STAGE_ORDER.indexOf(c.stage);
      if (idx === STAGE_ORDER.length - 1) return c;
      const next = STAGE_ORDER[idx + 1];
      toast(`Moved to ${STAGE_LABELS[next]}`, 'success');
      return { ...c, stage: next };
    }));
  };

  const handleAddProspect = () => {
    if (!prospectForm.name.trim() || !prospectForm.org.trim()) return;
    const newCard: PipelineCard = {
      id: `p${Date.now()}`,
      name: prospectForm.name.trim(),
      org: prospectForm.org.trim(),
      estimatedValue: parseFloat(prospectForm.estimatedValue) || 0,
      lastContact: new Date().toISOString().split('T')[0],
      stage: 'PROSPECT',
      notes: prospectForm.notes.trim() || undefined,
    };
    setPipeline(prev => [...prev, newCard]);
    toast(`${newCard.name} added to pipeline`, 'success');
    setProspectForm({ name: '', org: '', estimatedValue: '', notes: '' });
    setProspectModal(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Donor &amp; Partner CRM</h1>
            <p className="text-gray-500 text-sm">Track contacts, contributions, engagement history and fundraising pipeline</p>
          </div>
          <Heart className="h-8 w-8 text-[#1e3a5f] opacity-40" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['contacts', 'contributions', 'pipeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'pipeline' ? 'Pipeline' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTACTS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-6"></th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total Given</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No donor contacts found</td></tr>
                    ) : filteredContacts.map(u => {
                      const org = getOrg(u.orgId);
                      const isExpanded = expandedContact === u.id;
                      const userDonations = donations.filter(d => d.userId === u.id);
                      const notes = contactNotes.filter(n => n.contactId === u.id);

                      return [
                        <tr
                          key={u.id}
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedContact(isExpanded ? null : u.id)}
                        >
                          <td className="px-4 py-4 text-gray-400">
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0">
                                <span className="text-white text-xs">{u.avatarInitials || u.name.substring(0, 2).toUpperCase()}</span>
                              </div>
                              <span className="font-medium text-gray-900">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600 text-xs">{org?.name || u.orgId}</td>
                          <td className="px-4 py-4 text-gray-500 text-xs">{u.email}</td>
                          <td className="px-4 py-4 text-gray-500 text-xs">{u.phone || '—'}</td>
                          <td className="px-4 py-4 font-semibold text-[#1e3a5f] text-xs">
                            ${totalGiven(u.id).toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={u.status === 'APPROVED' ? 'success' : u.status === 'PENDING' ? 'warning' : 'danger'}>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-gray-400 text-xs">{lastActivity(u.id)}</td>
                          <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNoteModal({ userId: u.id, name: u.name })}
                            >
                              <StickyNote className="h-3.5 w-3.5" /> Add Note
                            </Button>
                          </td>
                        </tr>,

                        isExpanded && (
                          <tr key={`${u.id}-expanded`} className="bg-blue-50/40">
                            <td colSpan={9} className="px-8 py-4">
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Donation History</p>
                                {userDonations.length === 0 ? (
                                  <p className="text-sm text-gray-400">No donations on record</p>
                                ) : (
                                  <div className="space-y-2">
                                    {userDonations.map(d => (
                                      <div key={d.id} className="flex items-center gap-4 bg-white rounded-lg px-4 py-3 shadow-sm text-xs">
                                        <div className="flex-1 font-medium text-gray-800">{d.cause}</div>
                                        <div className="text-gray-500">{d.frequency.replace('_', ' ')}</div>
                                        <div className="font-bold text-[#1e3a5f]">${d.amount}/payment</div>
                                        <Badge variant={donationStatusVariant(d.status) as any}>{d.status}</Badge>
                                        <div className="text-gray-400">{formatDate(d.startDate)}</div>
                                        <div className="text-gray-400 font-mono">{d.receiptNumber}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {notes.length > 0 && (
                                  <div className="space-y-1 pt-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</p>
                                    {notes.map((n, i) => (
                                      <div key={i} className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-xs text-gray-700">
                                        <span className="text-gray-400 mr-2">{new Date(n.timestamp).toLocaleString()}</span>
                                        {n.text}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            CONTRIBUTIONS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'contributions' && (
          <div className="space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Donors</p>
                    <p className="text-2xl font-bold text-gray-900">{donorUsers.length}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Contributed (est.)</p>
                    <p className="text-2xl font-bold text-gray-900">${totalContributed.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active Recurring / Month</p>
                    <p className="text-2xl font-bold text-gray-900">${activeMonthly.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters + Export */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex gap-2">
                {(['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const).map(f => (
                  <Button
                    key={f}
                    variant={contribFilter === f ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setContribFilter(f)}
                  >
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast('Exporting...', 'info')}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Donor</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cause</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Frequency</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Start Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No donations found</td></tr>
                    ) : filteredDonations.map(d => {
                      const donor = getUser(d.userId);
                      const org = getOrg(d.orgId);
                      return (
                        <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0">
                                <span className="text-white text-[10px]">
                                  {donor ? (donor.avatarInitials || donor.name.substring(0, 2).toUpperCase()) : '?'}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900 text-xs">{donor?.name || d.userId}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{org?.name || d.orgId}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{d.cause}</td>
                          <td className="px-4 py-3 font-semibold text-[#1e3a5f] text-xs">${d.amount}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{d.frequency.replace('_', ' ')}</td>
                          <td className="px-4 py-3">
                            <Badge variant={donationStatusVariant(d.status) as any}>{d.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(d.startDate)}</td>
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs">{d.receiptNumber}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PIPELINE TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setProspectModal(true)}>
                <Plus className="h-4 w-4" /> Add Prospect
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {STAGE_ORDER.map(stage => {
                const cards = pipeline.filter(c => c.stage === stage);
                return (
                  <div key={stage} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">{STAGE_LABELS[stage]}</h3>
                      <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{cards.length}</span>
                    </div>
                    <div className={`space-y-3 min-h-[200px] bg-gray-50 rounded-lg p-3 border-t-4 ${STAGE_COLORS[stage]}`}>
                      {cards.length === 0 && (
                        <p className="text-xs text-gray-400 text-center pt-4">No contacts in this stage</p>
                      )}
                      {cards.map(card => (
                        <div key={card.id} className="bg-white rounded-lg shadow-sm p-3 space-y-2 border border-gray-100">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{card.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{card.org}</p>
                            </div>
                            <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium text-[#1e3a5f]">${card.estimatedValue.toLocaleString()}</span>
                            <span>Last: {formatDate(card.lastContact)}</span>
                          </div>
                          {card.notes && (
                            <p className="text-xs text-gray-400 italic truncate">{card.notes}</p>
                          )}
                          {stage !== 'LAPSED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => handleMoveStage(card.id)}
                            >
                              <ArrowRight className="h-3 w-3" />
                              Move to {STAGE_LABELS[STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1]]}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Note Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!noteModal}
        onClose={() => { setNoteModal(null); setNoteText(''); }}
        title={`Add Note — ${noteModal?.name ?? ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Enter note about this contact..."
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setNoteModal(null); setNoteText(''); }}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveNote} disabled={!noteText.trim()}>
              Save Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Prospect Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={prospectModal}
        onClose={() => setProspectModal(false)}
        title="Add Prospect"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={prospectForm.name}
              onChange={e => setProspectForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Organisation <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={prospectForm.org}
              onChange={e => setProspectForm(p => ({ ...p, org: e.target.value }))}
              placeholder="Organisation name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Value ($)</label>
            <input
              type="number"
              value={prospectForm.estimatedValue}
              onChange={e => setProspectForm(p => ({ ...p, estimatedValue: e.target.value }))}
              placeholder="0"
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={prospectForm.notes}
              onChange={e => setProspectForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Any initial notes..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setProspectModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddProspect}
              disabled={!prospectForm.name.trim() || !prospectForm.org.trim()}
            >
              <Plus className="h-4 w-4" /> Add Prospect
            </Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
