'use client';

import { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { Download, ChevronDown, ChevronRight, FileText, Users, Scale } from 'lucide-react';

type MeetingType = 'Board' | 'AGM' | 'Subcommittee';

interface MinutesEntry {
  id: string;
  date: string;
  type: MeetingType;
  title: string;
  fileSize: string;
}

interface AGMDocument {
  id: string;
  year: number;
  type: string;
  description: string;
  fileSize: string;
}

interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  organisation: string;
}

interface WorkingParty {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  leadContact: string;
}

const mockMinutes: MinutesEntry[] = [
  { id: 'm1', date: '2026-03-12', type: 'Board', title: 'Board Meeting — March 2026', fileSize: '245 KB' },
  { id: 'm2', date: '2026-02-11', type: 'Board', title: 'Board Meeting — February 2026', fileSize: '231 KB' },
  { id: 'm3', date: '2026-01-14', type: 'Board', title: 'Board Meeting — January 2026', fileSize: '218 KB' },
  { id: 'm4', date: '2025-11-19', type: 'Subcommittee', title: 'Governance Subcommittee — November 2025', fileSize: '178 KB' },
  { id: 'm5', date: '2025-10-08', type: 'Board', title: 'Board Meeting — October 2025', fileSize: '267 KB' },
  { id: 'm6', date: '2025-04-15', type: 'AGM', title: 'Annual General Meeting — 2025', fileSize: '512 KB' },
  { id: 'm7', date: '2025-08-13', type: 'Subcommittee', title: 'Community Engagement Subcommittee — August 2025', fileSize: '154 KB' },
  { id: 'm8', date: '2024-04-17', type: 'AGM', title: 'Annual General Meeting — 2024', fileSize: '489 KB' },
];

const mockAGMDocs: AGMDocument[] = [
  { id: 'a1', year: 2025, type: 'AGM Notice', description: 'Notice of Annual General Meeting including agenda and explanatory notes', fileSize: '198 KB' },
  { id: 'a2', year: 2025, type: 'AGM Minutes', description: 'Confirmed minutes of the 2025 Annual General Meeting', fileSize: '512 KB' },
  { id: 'a3', year: 2025, type: 'Annual Report', description: 'Ross House Association Annual Report 2024–2025', fileSize: '3.2 MB' },
  { id: 'a4', year: 2025, type: 'Financial Statements', description: 'Audited financial statements for the year ended 30 June 2025', fileSize: '1.1 MB' },
  { id: 'a5', year: 2024, type: 'AGM Notice', description: 'Notice of Annual General Meeting including agenda and explanatory notes', fileSize: '185 KB' },
  { id: 'a6', year: 2024, type: 'AGM Minutes', description: 'Confirmed minutes of the 2024 Annual General Meeting', fileSize: '489 KB' },
  { id: 'a7', year: 2024, type: 'Annual Report', description: 'Ross House Association Annual Report 2023–2024', fileSize: '2.9 MB' },
  { id: 'a8', year: 2024, type: 'Financial Statements', description: 'Audited financial statements for the year ended 30 June 2024', fileSize: '1.0 MB' },
];

const mockCommittee: CommitteeMember[] = [
  { id: 'c1', name: 'Margaret Thornton', role: 'Chair', organisation: 'Community Housing Victoria' },
  { id: 'c2', name: 'David Nguyen', role: 'Deputy Chair', organisation: 'Justice Connect' },
  { id: 'c3', name: 'Sarah Kowalczyk', role: 'Treasurer', organisation: 'Accountable NFP Advisory' },
  { id: 'c4', name: 'Patricia Okafor', role: 'Secretary', organisation: 'Tenants Victoria' },
  { id: 'c5', name: 'Robert Carmichael', role: 'General Member', organisation: 'AMES Australia' },
  { id: 'c6', name: 'Aisha Patel', role: 'General Member', organisation: 'Disability Resources Centre' },
  { id: 'c7', name: 'James Sullivan', role: 'General Member', organisation: 'Ross House Tenants Collective' },
];

const mockWorkingParties: WorkingParty[] = [
  {
    id: 'w1',
    name: 'Sustainability Working Party',
    description: 'Oversees the implementation of Ross House\'s sustainability strategy, including energy reduction targets, waste management, and environmental reporting.',
    memberCount: 6,
    leadContact: 'Sarah Kowalczyk',
  },
  {
    id: 'w2',
    name: 'Community Engagement Working Party',
    description: 'Coordinates tenant community activities, inter-organisation collaboration, and outreach programs that strengthen connections within the Ross House community.',
    memberCount: 8,
    leadContact: 'Aisha Patel',
  },
  {
    id: 'w3',
    name: 'Building & Facilities Working Party',
    description: 'Advises the Committee on building maintenance, capital works planning, and facility improvements to ensure Ross House meets the needs of all tenants.',
    memberCount: 5,
    leadContact: 'Robert Carmichael',
  },
  {
    id: 'w4',
    name: 'Digital & Communications Working Party',
    description: 'Guides the organisation\'s digital strategy, member communications, and technology investments including this tenant portal.',
    memberCount: 4,
    leadContact: 'David Nguyen',
  },
];

const meetingTypeBadge: Record<MeetingType, { variant: 'danger' | 'info' | 'warning' | 'default' }> = {
  AGM: { variant: 'danger' },
  Board: { variant: 'info' },
  Subcommittee: { variant: 'warning' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<'minutes' | 'agm-docs' | 'committee'>('minutes');
  const [expandedWP, setExpandedWP] = useState<string | null>('w1');

  const handleDownload = (title: string) => {
    toast(`Downloading "${title}"…`, 'success');
  };

  const tabs = [
    { id: 'minutes', label: 'Meeting Minutes' },
    { id: 'agm-docs', label: 'AGM Documents' },
    { id: 'committee', label: 'Committee & Working Parties' },
  ] as const;

  const agmYears = [2025, 2024];

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
            <p className="text-gray-500">Meeting minutes, AGM documents, committee members, and working parties</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Meeting Minutes */}
        {activeTab === 'minutes' && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Meeting Minutes</h2>
              <p className="text-sm text-gray-500 mt-0.5">Official minutes from Board, AGM, and Subcommittee meetings</p>
            </CardHeader>
            <div className="divide-y divide-gray-100">
              {mockMinutes.map(entry => (
                <div key={entry.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-[#1e3a5f]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                        <Badge variant={meetingTypeBadge[entry.type].variant}>{entry.type}</Badge>
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(entry.date)} · PDF · {entry.fileSize}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(entry.title)}
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AGM Documents */}
        {activeTab === 'agm-docs' && (
          <div className="space-y-6">
            {agmYears.map(year => (
              <Card key={year}>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">AGM {year}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Documents from the {year} Annual General Meeting</p>
                </CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                  {mockAGMDocs.filter(d => d.year === year).map(doc => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#1e3a5f] transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="h-5 w-5 text-[#1e3a5f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{doc.type}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{doc.description}</p>
                          <p className="text-xs text-gray-400 mt-1.5">PDF · {doc.fileSize}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleDownload(`${doc.type} ${year}`)}
                      >
                        <Download className="h-4 w-4" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Committee & Working Parties */}
        {activeTab === 'committee' && (
          <div className="space-y-6">
            {/* Committee Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#1e3a5f]" />
                  <h2 className="font-semibold text-gray-900">Committee Members</h2>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Current elected committee of the Ross House Association</p>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockCommittee.map(member => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-medium text-gray-900">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            member.role === 'Chair' ? 'danger' :
                            member.role === 'Deputy Chair' ? 'warning' :
                            member.role === 'Treasurer' ? 'info' :
                            member.role === 'Secretary' ? 'success' :
                            'default'
                          }>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{member.organisation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Working Parties */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Working Parties</h2>
                <p className="text-sm text-gray-500 mt-0.5">Subcommittees and working groups of the Ross House Association</p>
              </CardHeader>
              <CardBody className="space-y-2 pt-2">
                {mockWorkingParties.map(wp => (
                  <div key={wp.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedWP(expandedWP === wp.id ? null : wp.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 text-sm">{wp.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {wp.memberCount} members
                        </span>
                      </div>
                      {expandedWP === wp.id
                        ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      }
                    </button>
                    {expandedWP === wp.id && (
                      <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                        <p className="text-sm text-gray-600 leading-relaxed mt-3">{wp.description}</p>
                        <p className="text-xs text-gray-400 mt-2">Lead contact: <span className="font-medium text-gray-500">{wp.leadContact}</span></p>
                      </div>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
