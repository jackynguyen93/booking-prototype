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
import { FileText, Users, Plus, Trash2, Download, Pencil } from 'lucide-react';

type MeetingType = 'Board' | 'AGM' | 'Subcommittee';

interface MinutesEntry {
  id: string;
  date: string;
  type: MeetingType;
  title: string;
  fileSize: string;
}

interface BoardMember {
  id: string;
  name: string;
  role: string;
  email: string;
  since: string;
}

const INITIAL_MINUTES: MinutesEntry[] = [
  { id: 'min-1', date: '2026-03-12', type: 'Board', title: 'Board Meeting — March 2026', fileSize: '412 KB' },
  { id: 'min-2', date: '2026-02-12', type: 'Board', title: 'Board Meeting — February 2026', fileSize: '389 KB' },
  { id: 'min-3', date: '2026-01-15', type: 'Board', title: 'Board Meeting — January 2026', fileSize: '401 KB' },
  { id: 'min-4', date: '2025-11-20', type: 'AGM', title: 'AGM 2025 — Minutes & Resolutions', fileSize: '876 KB' },
  { id: 'min-5', date: '2026-03-08', type: 'Subcommittee', title: 'Finance & Governance — March 2026', fileSize: '245 KB' },
  { id: 'min-6', date: '2026-02-11', type: 'Subcommittee', title: 'Finance & Governance — February 2026', fileSize: '231 KB' },
];

const INITIAL_BOARD: BoardMember[] = [
  { id: 'bm-1', name: 'Dr. Patricia Lowe', role: 'Chairperson', email: 'p.lowe@rosshouse.org.au', since: '2023-07-01' },
  { id: 'bm-2', name: 'Robert Nguyen', role: 'Deputy Chair', email: 'r.nguyen@rosshouse.org.au', since: '2022-07-01' },
  { id: 'bm-3', name: 'Sandra Kaur', role: 'Treasurer', email: 's.kaur@rosshouse.org.au', since: '2024-07-01' },
  { id: 'bm-4', name: 'James Wu', role: 'Secretary', email: 'j.wu@rosshouse.org.au', since: '2023-07-01' },
  { id: 'bm-5', name: 'Amara Osei', role: 'Board Member', email: 'a.osei@rosshouse.org.au', since: '2024-07-01' },
  { id: 'bm-6', name: 'Claire Fitzgerald', role: 'Board Member', email: 'c.fitzgerald@rosshouse.org.au', since: '2022-07-01' },
];

const meetingTypeVariant: Record<MeetingType, 'danger' | 'info' | 'warning'> = {
  AGM: 'danger',
  Board: 'info',
  Subcommittee: 'warning',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AdminGovernancePage() {
  const { currentUser } = useAuth();
  const [minutes, setMinutes] = useState<MinutesEntry[]>(INITIAL_MINUTES);
  const [board, setBoard] = useState<BoardMember[]>(INITIAL_BOARD);
  const [typeFilter, setTypeFilter] = useState<'ALL' | MeetingType>('ALL');

  const [showUpload, setShowUpload] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [editMember, setEditMember] = useState<BoardMember | null>(null);
  const [confirmDeleteMin, setConfirmDeleteMin] = useState<string | null>(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<string | null>(null);

  const [minutesForm, setMinutesForm] = useState({ date: '', type: 'Board' as MeetingType, title: '', fileSize: '—' });
  const [memberForm, setMemberForm] = useState({ name: '', role: '', email: '', since: '' });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const filteredMinutes = typeFilter === 'ALL'
    ? minutes
    : minutes.filter(m => m.type === typeFilter);

  const handleUpload = () => {
    if (!minutesForm.date || !minutesForm.title) return;
    setMinutes(prev => [{
      id: generateId(),
      ...minutesForm,
    }, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setMinutesForm({ date: '', type: 'Board', title: '', fileSize: '—' });
    setShowUpload(false);
    toast('Minutes added', 'success');
  };

  const handleDeleteMinutes = (id: string) => {
    setMinutes(prev => prev.filter(m => m.id !== id));
    setConfirmDeleteMin(null);
    toast('Minutes removed', 'success');
  };

  const openEditMember = (m: BoardMember) => {
    setEditMember(m);
    setMemberForm({ name: m.name, role: m.role, email: m.email, since: m.since });
    setShowMember(true);
  };

  const openAddMember = () => {
    setEditMember(null);
    setMemberForm({ name: '', role: '', email: '', since: '' });
    setShowMember(true);
  };

  const handleSaveMember = () => {
    if (!memberForm.name || !memberForm.role) return;
    if (editMember) {
      setBoard(prev => prev.map(m => m.id === editMember.id ? { ...m, ...memberForm } : m));
      toast('Board member updated', 'success');
    } else {
      setBoard(prev => [...prev, { id: generateId(), ...memberForm }]);
      toast('Board member added', 'success');
    }
    setShowMember(false);
  };

  const handleDeleteMember = (id: string) => {
    setBoard(prev => prev.filter(m => m.id !== id));
    setConfirmDeleteMember(null);
    toast('Board member removed', 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
          <p className="text-gray-500">Manage meeting minutes, AGM documents, and board composition</p>
        </div>

        {/* Meeting Minutes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Meeting Minutes</h2>
                <p className="text-xs text-gray-400 mt-0.5">{minutes.length} documents</p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                  {(['ALL', 'Board', 'AGM', 'Subcommittee'] as const).map(t => (
                    <Button key={t} variant={typeFilter === t ? 'primary' : 'secondary'} size="sm"
                      onClick={() => setTypeFilter(t)}>
                      {t}
                    </Button>
                  ))}
                </div>
                <Button size="sm" onClick={() => setShowUpload(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Minutes
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMinutes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No minutes found</td></tr>
                ) : filteredMinutes.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800">{m.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={meetingTypeVariant[m.type]}>{m.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(m.date)}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{m.fileSize}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                        <button
                          onClick={() => setConfirmDeleteMin(m.id)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Board of Directors */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Board of Directors</h2>
                <p className="text-xs text-gray-400 mt-0.5">{board.length} members</p>
              </div>
              <Button size="sm" onClick={openAddMember}>
                <Plus className="h-3.5 w-3.5" /> Add Member
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Since</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {board.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{m.role}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{m.email}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(m.since)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEditMember(m)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => setConfirmDeleteMember(m.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Upload minutes modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Add Meeting Minutes" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={minutesForm.title} onChange={e => setMinutesForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="e.g. Board Meeting — April 2026" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date <span className="text-red-500">*</span></label>
              <input type="date" value={minutesForm.date} onChange={e => setMinutesForm(p => ({ ...p, date: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
              <select value={minutesForm.type} onChange={e => setMinutesForm(p => ({ ...p, type: e.target.value as MeetingType }))} className={inputClass}>
                <option value="Board">Board</option>
                <option value="AGM">AGM</option>
                <option value="Subcommittee">Subcommittee</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">File upload will be available when storage is integrated</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 10 MB</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowUpload(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleUpload} disabled={!minutesForm.date || !minutesForm.title} className="flex-1">Add Record</Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit board member modal */}
      <Modal isOpen={showMember} onClose={() => setShowMember(false)} title={editMember ? 'Edit Board Member' : 'Add Board Member'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="e.g. Dr. Jane Smith" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
            <input type="text" value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))} className={inputClass} placeholder="e.g. Treasurer" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="name@rosshouse.org.au" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term Start Date</label>
            <input type="date" value={memberForm.since} onChange={e => setMemberForm(p => ({ ...p, since: e.target.value }))} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowMember(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSaveMember} disabled={!memberForm.name || !memberForm.role} className="flex-1">
              {editMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete minutes confirmation */}
      <Modal isOpen={!!confirmDeleteMin} onClose={() => setConfirmDeleteMin(null)} title="Remove Minutes" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Remove this minutes document? It will no longer be visible to tenants.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmDeleteMin(null)} className="flex-1">Cancel</Button>
            <Button onClick={() => handleDeleteMinutes(confirmDeleteMin!)} className="flex-1 bg-red-600 hover:bg-red-700 border-red-600">Remove</Button>
          </div>
        </div>
      </Modal>

      {/* Delete member confirmation */}
      <Modal isOpen={!!confirmDeleteMember} onClose={() => setConfirmDeleteMember(null)} title="Remove Board Member" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Remove this person from the board listing? This only updates the directory — it does not affect any accounts.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmDeleteMember(null)} className="flex-1">Cancel</Button>
            <Button onClick={() => handleDeleteMember(confirmDeleteMember!)} className="flex-1 bg-red-600 hover:bg-red-700 border-red-600">Remove</Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
