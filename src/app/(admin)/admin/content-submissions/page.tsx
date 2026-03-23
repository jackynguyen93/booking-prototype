'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

type Publication = 'E-Bulletin' | 'Newsletter' | 'Annual Report';
type SubmissionStatus = 'Submitted' | 'Under Review' | 'Published' | 'Rejected';

interface Submission {
  id: string;
  title: string;
  publication: Publication;
  author: string;
  orgName: string;
  content: string;
  submittedAt: string;
  status: SubmissionStatus;
}

const statusConfig: Record<SubmissionStatus, { variant: 'default' | 'info' | 'success' | 'danger' }> = {
  Submitted: { variant: 'default' },
  'Under Review': { variant: 'info' },
  Published: { variant: 'success' },
  Rejected: { variant: 'danger' },
};

const publicationVariant: Record<Publication, 'info' | 'warning' | 'success'> = {
  'E-Bulletin': 'info',
  Newsletter: 'warning',
  'Annual Report': 'success',
};

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'cs-a1',
    title: 'New Digital Tools for Member Organisations',
    publication: 'Newsletter',
    author: 'Sarah Chen',
    orgName: 'Green Space Initiative',
    content: 'Our organisation has been piloting a suite of new digital tools over the past quarter to improve member engagement and reduce administrative overhead. We have found significant improvements in our volunteer coordination, donation tracking, and event management workflows. We would like to share our learnings with the broader Ross House community in hopes of helping other organisations on similar journeys.',
    submittedAt: '2026-02-28T14:30:00Z',
    status: 'Under Review',
  },
  {
    id: 'cs-a2',
    title: 'Celebrating 40 Years of Community Impact',
    publication: 'Annual Report',
    author: 'Marcus Johnson',
    orgName: 'Green Space Initiative',
    content: 'Forty years ago, a small group of dedicated community advocates came together in this very building to begin what would become one of Melbourne\'s most impactful not-for-profit collectives. Today we reflect on the thousands of lives touched, the hundreds of campaigns championed, and the dozens of organisations that have called Ross House home. This report celebrates those four decades of community leadership.',
    submittedAt: '2025-09-15T10:00:00Z',
    status: 'Published',
  },
  {
    id: 'cs-a3',
    title: 'Tech Skills Workshops — Free for Community Members',
    publication: 'E-Bulletin',
    author: 'Alex Rivera',
    orgName: 'TechStart Community',
    content: 'TechStart Community is launching a series of free technology skills workshops open to all Ross House tenants and their clients. Topics will include basic computer literacy, cybersecurity awareness, social media for nonprofits, and intro to data analytics. Sessions are 90 minutes, hosted in Training Room 1 on the second Tuesday of each month.',
    submittedAt: '2026-03-10T09:00:00Z',
    status: 'Submitted',
  },
  {
    id: 'cs-a4',
    title: 'Grant Success: Expanding Our Mental Health Services',
    publication: 'Newsletter',
    author: 'Sarah Chen',
    orgName: 'Green Space Initiative',
    content: 'We are thrilled to announce that our organisation has been awarded a $45,000 grant from the Victorian Government to expand our mental health support programs. This funding will allow us to hire an additional part-time counsellor and extend our drop-in clinic hours to include Saturday mornings. We are deeply grateful to everyone who supported our application.',
    submittedAt: '2026-03-18T11:30:00Z',
    status: 'Submitted',
  },
  {
    id: 'cs-a5',
    title: 'Rooftop Garden Project Update',
    publication: 'E-Bulletin',
    author: 'Jordan Kim',
    orgName: 'Green Space Initiative',
    content: 'Phase 2 of our rooftop garden project is now complete. We have added 12 new planter beds, a rainwater collection system, and a composting station. All tenants are welcome to use the garden — simply book a session through the booking system. We are also seeking volunteers to help with weekly maintenance on Thursday afternoons.',
    submittedAt: '2026-01-22T16:00:00Z',
    status: 'Rejected',
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminContentSubmissionsPage() {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [pubFilter, setPubFilter] = useState<'ALL' | Publication>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SubmissionStatus>('ALL');
  const [selected, setSelected] = useState<Submission | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const updateStatus = (id: string, status: SubmissionStatus) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    setSelected(null);
    toast(`Submission marked as ${status}`, 'success');
  };

  const filtered = submissions.filter(s => {
    if (pubFilter !== 'ALL' && s.publication !== pubFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = submissions.filter(s => s.status === 'Submitted').length;
  const reviewCount = submissions.filter(s => s.status === 'Under Review').length;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Submissions</h1>
          <p className="text-gray-500">
            {pendingCount > 0 && <span className="text-orange-500 font-medium">{pendingCount} new · </span>}
            {reviewCount > 0 && <span className="text-blue-500 font-medium">{reviewCount} under review · </span>}
            Articles submitted by tenants for RHA publications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {(['Submitted', 'Under Review', 'Published', 'Rejected'] as SubmissionStatus[]).map(s => (
            <div key={s} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter(sub => sub.status === s).length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">Publication:</span>
            {(['ALL', 'E-Bulletin', 'Newsletter', 'Annual Report'] as const).map(f => (
              <Button key={f} variant={pubFilter === f ? 'primary' : 'secondary'} size="sm"
                onClick={() => setPubFilter(f)}>
                {f}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">Status:</span>
            {(['ALL', 'Submitted', 'Under Review', 'Published', 'Rejected'] as const).map(f => (
              <Button key={f} variant={statusFilter === f ? 'primary' : 'secondary'} size="sm"
                onClick={() => setStatusFilter(f)}>
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Submissions list */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Publication</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No submissions found</td></tr>
                ) : filtered.map(s => (
                  <>
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-400">by {s.author}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{s.orgName}</td>
                      <td className="px-6 py-4">
                        <Badge variant={publicationVariant[s.publication]}>{s.publication}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(s.submittedAt)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={statusConfig[s.status].variant}>{s.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {expanded === s.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            Preview
                          </button>
                          {(s.status === 'Submitted' || s.status === 'Under Review') && (
                            <Button variant="outline" size="sm" onClick={() => { setSelected(s); setRejectionNote(''); }}>
                              Review
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <tr key={`${s.id}-expanded`} className="bg-blue-50/30">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Article Content</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{s.content}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Review Submission" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-gray-900">{selected.title}</p>
              <div className="flex gap-2">
                <Badge variant={publicationVariant[selected.publication]}>{selected.publication}</Badge>
                <Badge variant="default">{selected.orgName}</Badge>
              </div>
              <p className="text-xs text-gray-500">by {selected.author} · Submitted {formatDate(selected.submittedAt)}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-600 leading-relaxed">{selected.content}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Rejection reason (optional)</label>
              <textarea
                value={rejectionNote}
                onChange={e => setRejectionNote(e.target.value)}
                rows={2}
                placeholder="Provide feedback to the submitter if rejecting..."
                className={inputClass}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
              {selected.status === 'Submitted' && (
                <Button
                  variant="outline"
                  onClick={() => updateStatus(selected.id, 'Under Review')}
                  className="flex-1"
                >
                  Mark Under Review
                </Button>
              )}
              <Button
                onClick={() => updateStatus(selected.id, 'Rejected')}
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
              >
                Reject
              </Button>
              <Button onClick={() => updateStatus(selected.id, 'Published')} className="flex-1">
                Publish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
