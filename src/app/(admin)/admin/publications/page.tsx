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
import { Upload, FileText, Trash2, Edit3 } from 'lucide-react';

type PubCategory = 'Newsletter' | 'Annual Report' | 'E-Bulletin' | 'Policy' | 'House Rules';
type PubAccess = 'Public' | 'Members Only' | 'Tenants Only';

interface Publication {
  id: string;
  title: string;
  category: PubCategory;
  date: string;
  access: PubAccess;
  filename: string;
  createdAt: string;
}

const INITIAL_PUBLICATIONS: Publication[] = [
  { id: 'pub1', title: 'Ross House Newsletter — March 2026', category: 'Newsletter', date: '2026-03', access: 'Public', filename: 'newsletter-mar-2026.pdf', createdAt: '2026-03-01T09:00:00Z' },
  { id: 'pub2', title: 'Ross House Newsletter — February 2026', category: 'Newsletter', date: '2026-02', access: 'Public', filename: 'newsletter-feb-2026.pdf', createdAt: '2026-02-01T09:00:00Z' },
  { id: 'pub3', title: 'Annual Report 2024–2025', category: 'Annual Report', date: '2025-10', access: 'Public', filename: 'annual-report-2024-25.pdf', createdAt: '2025-10-15T09:00:00Z' },
  { id: 'pub4', title: 'Annual Report 2023–2024', category: 'Annual Report', date: '2024-10', access: 'Public', filename: 'annual-report-2023-24.pdf', createdAt: '2024-10-20T09:00:00Z' },
  { id: 'pub5', title: 'Member E-Bulletin — Q1 2026', category: 'E-Bulletin', date: '2026-01', access: 'Members Only', filename: 'ebulletin-q1-2026.pdf', createdAt: '2026-01-10T09:00:00Z' },
  { id: 'pub6', title: 'Tenant E-Bulletin — Q1 2026', category: 'E-Bulletin', date: '2026-01', access: 'Tenants Only', filename: 'tenant-ebulletin-q1-2026.pdf', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'pub7', title: 'Community Centre Usage Policy', category: 'Policy', date: '2025-06', access: 'Public', filename: 'usage-policy-2025.pdf', createdAt: '2025-06-01T09:00:00Z' },
  { id: 'pub8', title: 'Ross House Rules & Regulations', category: 'House Rules', date: '2025-07', access: 'Members Only', filename: 'house-rules-2025.pdf', createdAt: '2025-07-01T09:00:00Z' },
];

const CATEGORY_TABS: Array<'All' | PubCategory> = ['All', 'Newsletter', 'Annual Report', 'E-Bulletin', 'Policy', 'House Rules'];

const accessVariant = (access: PubAccess) => {
  const m: Record<PubAccess, string> = { 'Public': 'success', 'Members Only': 'info', 'Tenants Only': 'warning' };
  return m[access] as 'success' | 'info' | 'warning';
};

const categoryVariant = (cat: PubCategory) => {
  const m: Record<PubCategory, string> = {
    'Newsletter': 'info',
    'Annual Report': 'success',
    'E-Bulletin': 'warning',
    'Policy': 'danger',
    'House Rules': 'default',
  };
  return m[cat] as 'info' | 'success' | 'warning' | 'danger' | 'default';
};

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

export default function PublicationsPage() {
  const { currentUser } = useAuth();
  const [publications, setPublications] = useState<Publication[]>(INITIAL_PUBLICATIONS);
  const [categoryFilter, setCategoryFilter] = useState<'All' | PubCategory>('All');
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Newsletter' as PubCategory,
    date: '2026-03',
    access: 'Public' as PubAccess,
    filename: '',
  });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const filtered = categoryFilter === 'All'
    ? publications
    : publications.filter(p => p.category === categoryFilter);

  const openUpload = () => {
    setEditingId(null);
    setForm({ title: '', category: 'Newsletter', date: '2026-03', access: 'Public', filename: '' });
    setShowUpload(true);
  };

  const openEdit = (pub: Publication) => {
    setEditingId(pub.id);
    setForm({ title: pub.title, category: pub.category, date: pub.date, access: pub.access, filename: pub.filename });
    setShowUpload(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    if (editingId) {
      setPublications(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p));
      toast('Publication updated successfully', 'success');
    } else {
      const newPub: Publication = {
        id: generateId(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      setPublications(prev => [newPub, ...prev]);
      toast('Publication uploaded successfully', 'success');
    }

    setSaving(false);
    setShowUpload(false);
  };

  const handleDelete = (id: string, title: string) => {
    setPublications(prev => prev.filter(p => p.id !== id));
    toast(`"${title}" deleted`, 'warning');
  };

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  };

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Publications Management</h1>
            <p className="text-gray-500">Upload and manage newsletters, annual reports, and other publications</p>
          </div>
          <Button onClick={openUpload}>
            <Upload className="h-4 w-4" />
            Upload Publication
          </Button>
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setCategoryFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === tab
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
              {tab !== 'All' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({publications.filter(p => p.category === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Publications table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Access Level</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">File</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                      <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                      No publications found
                    </td>
                  </tr>
                ) : filtered.map(pub => (
                  <tr key={pub.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800 text-sm">{pub.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={categoryVariant(pub.category)}>{pub.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(pub.date)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={accessVariant(pub.access)}>{pub.access}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">{pub.filename}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(pub)}>
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(pub.id, pub.title)}>
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Upload / Edit Modal */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title={editingId ? 'Edit Publication' : 'Upload Publication'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Ross House Newsletter — March 2026"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value as PubCategory }))}
                className={inputClass}
              >
                <option value="Newsletter">Newsletter</option>
                <option value="Annual Report">Annual Report</option>
                <option value="E-Bulletin">E-Bulletin</option>
                <option value="Policy">Policy</option>
                <option value="House Rules">House Rules</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date (Month / Year)</label>
              <input
                type="month"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
            <select
              value={form.access}
              onChange={e => setForm(p => ({ ...p, access: e.target.value as PubAccess }))}
              className={inputClass}
            >
              <option value="Public">Public — Anyone can view</option>
              <option value="Members Only">Members Only</option>
              <option value="Tenants Only">Tenants Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) setForm(p => ({ ...p, filename: file.name }));
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#1e3a5f] file:text-white hover:file:bg-[#16304f] cursor-pointer"
            />
            {form.filename && (
              <p className="mt-1.5 text-xs text-gray-500">Selected: {form.filename}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowUpload(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editingId ? 'Save Changes' : 'Upload Publication'}
            </Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
