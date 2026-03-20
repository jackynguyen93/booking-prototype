import { ParcelAlert } from '@/types';

export const mockParcelAlerts: ParcelAlert[] = [
  {
    id: 'pa1',
    orgId: 'org2',
    description: 'Medium box from Australia Post — approx 30x20x15cm',
    sentAt: '2026-03-19T14:30:00Z',
    sentBy: 'u1',
  },
  {
    id: 'pa2',
    orgId: 'org3',
    description: 'Registered letter from ATO',
    sentAt: '2026-03-18T10:00:00Z',
    sentBy: 'u1',
  },
  {
    id: 'pa3',
    orgId: 'org2',
    description: 'Large parcel from Officeworks — 2 boxes',
    sentAt: '2026-03-15T11:30:00Z',
    sentBy: 'u1',
  },
  {
    id: 'pa4',
    orgId: 'org3',
    description: 'Courier delivery — laptop bag from Dell',
    sentAt: '2026-03-12T09:15:00Z',
    sentBy: 'u1',
  },
];
