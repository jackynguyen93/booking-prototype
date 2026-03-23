'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { generateId } from '@/lib/utils';
import { ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';

type Publication = 'E-Bulletin' | 'Newsletter' | 'Annual Report';
type SubmissionStatus = 'Submitted' | 'Under Review' | 'Published' | 'Rejected';

interface Submission {
  id: string;
  title: string;
  publication: Publication;
  author: string;
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

const publicationConfig: Record<Publication, { variant: 'info' | 'warning' | 'success' }> = {
  'E-Bulletin': { variant: 'info' },
  Newsletter: { variant: 'warning' },
  'Annual Report': { variant: 'success' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export default function ContentSubmissionsPage() {
  const { currentUser } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    publication: 'E-Bulletin' as Publication,
    title: '',
    author: currentUser?.name || '',
    content: '',
  });

  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      id: 'cs-1',
      title: 'Celebrating 40 Years of Community Impact at Ross House',
      publication: 'Annual Report',
      author: currentUser?.name || 'Current User',
      content: '',
      submittedAt: '2025-09-15T10:00:00Z',
      status: 'Published',
    },
    {
      id: 'cs-2',
      title: 'New Digital Tools for Member Organisations',
      publication: 'Newsletter',
      author: currentUser?.name || 'Current User',
      content: '',
      submittedAt: '2026-02-28T14:30:00Z',
      status: 'Under Review',
    },
  ]);

  if (!currentUser) return null;

  const wc = useMemo(() => wordCount(form.content), [form.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const sub: Submission = {
      id: generateId(),
      title: form.title,
      publication: form.publication,
      author: form.author || currentUser.name,
      content: form.content,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
    };
    setSubmissions(prev => [sub, ...prev]);
    setForm({ publication: 'E-Bulletin', title: '', author: currentUser.name, content: '' });
    setSubmitting(false);
    setFormOpen(false);
    toast(`Submission "${sub.title}" received successfully`, 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  const deadlines: Record<Publication, string> = {
    'E-Bulletin': 'E-Bulletin closes the 25th of each month',
    'Newsletter': 'Newsletter closes the last Friday of each month',
    'Annual Report': 'Annual Report submissions due 31 August each year',
  };

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Submissions</h1>
          <p className="text-gray-500 mt-1">
            Submit articles, news, and content for the RHA e-bulletin, newsletter, and annual report.
          </p>
        </div>

        {/* New Submission (collapsible) */}
        <Card>
          <button
            onClick={() => setFormOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 rounded-t-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1e3a5f]" />
              <span className="font-semibold text-gray-900">New Submission</span>
            </div>
            {formOpen
              ? <ChevronUp className="h-5 w-5 text-gray-400" />
              : <ChevronDown className="h-5 w-5 text-gray-400" />
            }
          </button>

          {formOpen && (
            <div className="border-t border-gray-200">
              <CardBody>
                {/* Deadline notice */}
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-700">{deadlines[form.publication]}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Publication Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {(['E-Bulletin', 'Newsletter', 'Annual Report'] as Publication[]).map(pub => (
                        <label
                          key={pub}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                            form.publication === pub
                              ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f] font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="publication"
                            value={pub}
                            checked={form.publication === pub}
                            onChange={() => setForm(p => ({ ...p, publication: pub }))}
                            className="sr-only"
                          />
                          {pub}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Article Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Enter article title"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                      className={`${inputClass} bg-gray-50`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-xs ${wc > 800 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                        {wc} word{wc !== 1 ? 's' : ''}
                        {form.publication === 'E-Bulletin' && ' (max 300 recommended)'}
                        {form.publication === 'Newsletter' && ' (max 600 recommended)'}
                        {form.publication === 'Annual Report' && ' (max 800 recommended)'}
                      </span>
                    </div>
                    <textarea
                      value={form.content}
                      onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                      rows={6}
                      placeholder="Write or paste your article content here..."
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={submitting}>
                      Submit Article
                    </Button>
                  </div>
                </form>
              </CardBody>
            </div>
          )}
        </Card>

        {/* My Submissions */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">My Submissions</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track the status of your submitted articles</p>
          </CardHeader>
          {submissions.length === 0 ? (
            <CardBody className="text-center py-10">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No submissions yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setFormOpen(true)}>
                Submit Your First Article
              </Button>
            </CardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Publication</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{sub.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={publicationConfig[sub.publication].variant}>
                          {sub.publication}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{sub.author}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(sub.submittedAt)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={statusConfig[sub.status].variant}>
                          {sub.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  );
}
