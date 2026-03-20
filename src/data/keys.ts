import { KeyRecord } from '@/types';

export const mockKeyRecords: KeyRecord[] = [
  {
    id: 'k1',
    orgId: 'org2',
    personName: 'Sarah Mitchell',
    keyType: 'Level 3 Office Key',
    dateIssued: '2023-03-20',
    returned: false,
  },
  {
    id: 'k2',
    orgId: 'org2',
    personName: 'Tom Bradley',
    keyType: 'Level 3 Office Key',
    dateIssued: '2023-06-01',
    returned: false,
  },
  {
    id: 'k3',
    orgId: 'org2',
    personName: 'Alice Park',
    keyType: 'Building Master Key',
    dateIssued: '2023-03-20',
    returned: true,
    returnedDate: '2025-01-15',
  },
  {
    id: 'k4',
    orgId: 'org3',
    personName: 'James Chen',
    keyType: 'Level 2 Office Key',
    dateIssued: '2023-07-01',
    returned: false,
  },
  {
    id: 'k5',
    orgId: 'org3',
    personName: 'Priya Sharma',
    keyType: 'Level 2 Office Key',
    dateIssued: '2024-01-10',
    returned: false,
  },
  {
    id: 'k6',
    orgId: 'org3',
    personName: 'Wei Zhang',
    keyType: 'Storage Room Key',
    dateIssued: '2024-03-15',
    returned: true,
    returnedDate: '2024-09-30',
  },
];
