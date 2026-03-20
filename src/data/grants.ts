import { GrantApplication } from '@/types';

export const mockGrantApplications: GrantApplication[] = [
  {
    id: 'gr1',
    orgId: 'org2',
    userId: 'u2',
    description: 'Funding to support the expansion of our community garden program to two additional sites in the CBD.',
    amountRequested: 15000,
    purpose: 'Program Expansion',
    status: 'APPROVED',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'gr2',
    orgId: 'org2',
    userId: 'u2',
    description: 'Equipment grant for new gardening tools, raised garden beds, and irrigation system for the Southbank site.',
    amountRequested: 5000,
    purpose: 'Equipment Purchase',
    status: 'UNDER_REVIEW',
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-05T11:00:00Z',
  },
  {
    id: 'gr3',
    orgId: 'org3',
    userId: 'u3',
    description: 'Funding for our annual hackathon event bringing together 100+ developers from disadvantaged backgrounds.',
    amountRequested: 8000,
    purpose: 'Event Funding',
    status: 'SUBMITTED',
    createdAt: '2026-03-18T15:00:00Z',
    updatedAt: '2026-03-18T15:00:00Z',
  },
];
