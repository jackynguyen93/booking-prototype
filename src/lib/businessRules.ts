import { UserRole, Room } from '@/types';

export const BOOKING_HOURS = {
  MEMBER_TENANT: { start: 7, end: 23 },
  COMMERCIAL_TENANT: { start: 7, end: 23 },
  FACILITY_USER: { start: 8, end: 20 },
  TRADES: { start: 8, end: 18 },
  ADMIN: { start: 0, end: 24 },
  COMMUNITY_MEMBER: { start: 8, end: 20 },
};

export function getBookingHours(role: UserRole) {
  return BOOKING_HOURS[role] || { start: 8, end: 20 };
}

export function calculatePrice(room: Room, durationHours: number): number {
  if (room.pricePerHour === 0) return 0;
  if (room.priceCapHours) {
    const cappedHours = Math.min(durationHours, room.priceCapHours);
    return cappedHours * room.pricePerHour;
  }
  return durationHours * room.pricePerHour;
}

export function canAccessRoom(room: Room, role: UserRole): boolean {
  if (room.adminManaged) return role === 'ADMIN';
  if (room.tenantsOnly) {
    return ['MEMBER_TENANT', 'COMMERCIAL_TENANT', 'ADMIN'].includes(role);
  }
  return true;
}

export function getCancellationPolicy(bookingDate: string, bookingTime: string): {
  refundPercent: number;
  message: string;
} {
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
  const now = new Date();
  const diffMs = bookingDateTime.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays >= 2) {
    return { refundPercent: 100, message: 'Full refund available (more than 2 days notice)' };
  } else {
    return { refundPercent: 50, message: '50% charge applies (less than 2 days notice)' };
  }
}

export const CANCELLATION_POLICY = `
**Cancellation Policy**
- 2+ days notice: Full refund
- Less than 2 days notice: 50% cancellation charge
- No-show: Full charge applies

**Terms of Use**
- Rooms must be left clean and tidy
- AV equipment must be handled with care
- Any damage will be charged to the booking organisation
- Noise levels must be kept reasonable at all times
- Bookings cannot be transferred to other organisations
`;

export const AV_INDUCTION_NOTICE = `
This room has AV equipment (projector/screen, HDMI connections, video conferencing).
Please ensure at least one person in your group has completed the AV induction before using this equipment.
Contact reception to arrange an induction if required.
`;
