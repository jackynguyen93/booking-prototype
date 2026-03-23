'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, Users, Heart, Clock, Download, FileText } from 'lucide-react';

const impactStats = [
  { label: 'Organisations Supported', value: '142', icon: <Users className="h-8 w-8 text-blue-500" /> },
  { label: 'Raised to Date', value: '$2.4M', icon: <TrendingUp className="h-8 w-8 text-green-500" /> },
  { label: 'Years of Community Service', value: '18', icon: <Clock className="h-8 w-8 text-purple-500" /> },
  { label: 'Lives Impacted', value: '50,000+', icon: <Heart className="h-8 w-8 text-pink-500" /> },
];

const campaigns = [
  {
    id: 'c1',
    title: 'Community Arts & Culture Program',
    description: 'Supporting local artists and cultural organisations with studio space and resources.',
    raised: 38500,
    target: 50000,
  },
  {
    id: 'c2',
    title: 'Youth Wellbeing Initiative',
    description: 'Providing mental health, education, and employment support for young Melburnians.',
    raised: 72000,
    target: 100000,
  },
  {
    id: 'c3',
    title: 'Migrant & Refugee Services Hub',
    description: 'Funding essential support services for newly arrived migrants and refugee families.',
    raised: 19200,
    target: 40000,
  },
];

const updates = [
  {
    id: 'u1',
    date: '12 March 2026',
    title: 'New Community Arts Studio Opens',
    body: 'Thanks to generous donor support, the Community Arts Studio on Level 3 opened its doors this month, providing free studio access to 12 emerging artists from across Melbourne.',
  },
  {
    id: 'u2',
    date: '28 February 2026',
    title: 'Youth Wellbeing Program Reaches 500 Participants',
    body: 'The Youth Wellbeing Initiative has now supported over 500 young people aged 15–25, with an 82% positive outcome rate reported by participating organisations.',
  },
  {
    id: 'u3',
    date: '14 January 2026',
    title: '$2.4M Milestone Reached',
    body: 'Ross House Association is proud to announce it has raised $2.4 million in total donations since 2008, a testament to our incredible community of donors and partners.',
  },
  {
    id: 'u4',
    date: '5 December 2025',
    title: 'Migrant Services Expansion',
    body: 'Donor funding enabled us to extend the Migrant & Refugee Services Hub operating hours, supporting 60 additional families per month with legal advice, language support, and housing assistance.',
  },
];

const resources = [
  { id: 'r1', title: 'Partner Agreement Template', type: 'PDF', size: '124 KB' },
  { id: 'r2', title: 'Annual Impact Report 2025', type: 'PDF', size: '2.1 MB' },
  { id: 'r3', title: 'Donation Tax Receipt Guide', type: 'PDF', size: '88 KB' },
  { id: 'r4', title: 'Community Investment Strategy 2026', type: 'PDF', size: '540 KB' },
];

function ProgressBar({ raised, target }: { raised: number; target: number }) {
  const percent = Math.min(100, Math.round((raised / target) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>${(raised / 1000).toFixed(0)}k raised</span>
        <span>{percent}% of ${(target / 1000).toFixed(0)}k goal</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-[#1e3a5f] rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function ImpactPage() {
  return (
    <PortalLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fundraising Impact &amp; Updates</h1>
          <p className="text-gray-500">See how your support is making a difference in the Melbourne community.</p>
        </div>

        {/* Hero impact stats */}
        <div className="bg-[#1e3a5f] rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-1">Total Community Impact</h2>
          <p className="text-blue-200 text-sm mb-6">Across all donors, partners, and programs since 2008.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {impactStats.map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Priorities */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1e3a5f]" /> Current Fundraising Priorities
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{campaign.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{campaign.description}</p>
                  <ProgressBar raised={campaign.raised} target={campaign.target} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Recent Updates</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {updates.map(update => (
                <div key={update.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <p className="text-xs text-gray-400 mb-1">{update.date}</p>
                  <h3 className="font-semibold text-gray-900 mb-1">{update.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{update.body}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Partner Resources */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#1e3a5f]" /> Partner Resources
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {resources.map(resource => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1e3a5f]/10 rounded-md flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#1e3a5f]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{resource.title}</p>
                      <p className="text-xs text-gray-400">{resource.type} · {resource.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </PortalLayout>
  );
}
