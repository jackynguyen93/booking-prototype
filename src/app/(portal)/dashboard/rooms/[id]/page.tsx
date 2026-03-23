'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockRooms } from '@/data/rooms';
import { canAccessRoom } from '@/lib/businessRules';
import { formatCurrency } from '@/lib/utils';
import { Users, Monitor, DollarSign, MapPin, ArrowLeft, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { addDays, format, startOfWeek } from 'date-fns';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

const PRICING: Record<string, { label: string; discount: string }> = {
  MEMBER_TENANT: { label: 'Member Tenant', discount: 'Standard rate' },
  COMMERCIAL_TENANT: { label: 'Commercial Tenant', discount: 'Standard rate' },
  FACILITY_USER: { label: 'Facility User', discount: 'Standard rate' },
  COMMUNITY_MEMBER: { label: 'Community Member', discount: 'Standard rate' },
  ADMIN: { label: 'Admin', discount: 'All rates apply' },
};

function isSlotBooked(
  roomBookings: { date: string; startTime: string; endTime: string; status: string }[],
  date: string,
  slotTime: string,
): boolean {
  const slotMin = parseInt(slotTime.split(':')[0]) * 60 + parseInt(slotTime.split(':')[1]);
  return roomBookings.some(b => {
    if (b.date !== date || b.status === 'CANCELLED') return false;
    const startMin = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
    const endMin = parseInt(b.endTime.split(':')[0]) * 60 + parseInt(b.endTime.split(':')[1]);
    return slotMin >= startMin && slotMin < endMin;
  });
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { bookings } = useApp();

  if (!currentUser) return null;

  const room = mockRooms.find(r => r.id === id);

  if (!room) {
    return (
      <PortalLayout>
        <div className="text-center py-16">
          <p className="text-gray-500">Room not found.</p>
          <Link href="/dashboard/rooms"><Button variant="ghost" className="mt-2">Back to Rooms</Button></Link>
        </div>
      </PortalLayout>
    );
  }

  if (!canAccessRoom(room, currentUser.role)) {
    return (
      <PortalLayout>
        <div className="text-center py-16">
          <p className="text-gray-500">You do not have access to this room.</p>
          <Link href="/dashboard/rooms"><Button variant="ghost" className="mt-2">Back to Rooms</Button></Link>
        </div>
      </PortalLayout>
    );
  }

  const roomBookings = bookings.filter(b => b.roomId === room.id);

  // Build week: Mon–Sun of current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BOARD_ROOM: 'Board Room',
      TRAINING_ROOM: 'Training Room',
      MEETING_ROOM: 'Meeting Room',
      PHONE_BOOTH: 'Phone Booth',
      CAR_PARK: 'Car Park',
    };
    return labels[type] || type;
  };

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Back link */}
        <div>
          <Link href="/dashboard/rooms" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </Link>
        </div>

        {/* Header banner */}
        <div className={`rounded-xl ${room.colorClass} p-6 flex items-start justify-between`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{getRoomTypeLabel(room.type)}</Badge>
              {room.hasAV && <Badge variant="info">AV Equipped</Badge>}
              {room.tenantsOnly && <Badge variant="warning">Tenants Only</Badge>}
              {room.pricePerHour === 0 && <Badge variant="success">Free</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-600 text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{room.floor}</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
              {room.hasAV && <span className="flex items-center gap-1"><Monitor className="h-4 w-4" />AV Equipment</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 flex items-center gap-1 justify-end">
              <DollarSign className="h-6 w-6" />
              {room.pricePerHour === 0 ? 'Free' : `${formatCurrency(room.pricePerHour)}/hr`}
            </p>
            {room.priceCapHours && (
              <p className="text-sm text-gray-500 mt-0.5">
                Max {formatCurrency(room.pricePerHour * room.priceCapHours)}/day
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader><h2 className="font-semibold text-gray-900">About this Room</h2></CardHeader>
              <CardBody>
                <p className="text-gray-700 text-sm leading-relaxed">{room.description}</p>

                {room.hasAV && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      AV Equipment Available
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This room is equipped with a projector/screen, HDMI connections, and video conferencing capabilities.
                      Please ensure someone in your group has completed the AV induction before your booking.
                      Contact reception to arrange an induction if required.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Pricing per user type */}
            <Card>
              <CardHeader><h2 className="font-semibold text-gray-900">Pricing</h2></CardHeader>
              <CardBody>
                {room.pricePerHour === 0 ? (
                  <p className="text-sm text-gray-600">This room is <strong>complimentary</strong> for eligible users.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">User Type</th>
                            <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                            <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(PRICING).map(([role, info]) => (
                            <tr key={role} className="border-b border-gray-50 last:border-0">
                              <td className="py-2.5 text-gray-700">{info.label}</td>
                              <td className="py-2.5 text-right font-semibold text-gray-900">{formatCurrency(room.pricePerHour)}/hr</td>
                              <td className="py-2.5 text-right text-gray-500">
                                {room.priceCapHours
                                  ? `${formatCurrency(room.pricePerHour * room.priceCapHours)} (${room.priceCapHours}hr max)`
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Invoiced monthly to your organisation account.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Weekly availability grid */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-gray-500" />
                  Weekly Availability
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Week of {format(weekStart, 'd MMM yyyy')}
                </p>
              </CardHeader>
              <CardBody className="overflow-x-auto p-0">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-500 border-b border-r border-gray-200 w-16">Time</th>
                      {days.map(day => (
                        <th
                          key={day.toISOString()}
                          className={`px-2 py-2 text-center font-medium border-b border-gray-200 ${
                            format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                              ? 'bg-[#1e3a5f] text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          <div>{format(day, 'EEE')}</div>
                          <div className="font-bold">{format(day, 'd')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot, idx) => (
                      <tr key={slot} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-3 py-1.5 text-gray-400 border-r border-gray-200 font-mono whitespace-nowrap">
                          {slot}
                        </td>
                        {days.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const booked = isSlotBooked(roomBookings, dateStr, slot);
                          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                          return (
                            <td
                              key={dateStr}
                              className={`px-2 py-1.5 text-center border-b border-gray-100 ${
                                booked
                                  ? 'bg-red-100 text-red-700 font-medium'
                                  : isToday
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {booked ? '●' : '○'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="text-red-500">●</span>Booked</span>
                  <span className="flex items-center gap-1.5"><span className="text-green-500">○</span>Available</span>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right: CTA */}
          <div className="space-y-4">
            <Card>
              <CardBody className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {room.pricePerHour === 0 ? 'Free' : `${formatCurrency(room.pricePerHour)}/hr`}
                  </p>
                  {room.priceCapHours && (
                    <p className="text-sm text-gray-500">Max {formatCurrency(room.pricePerHour * room.priceCapHours)}/day</p>
                  )}
                </div>

                <Link href={`/dashboard/rooms/${room.id}/book`} className="block">
                  <Button className="w-full" size="lg">Book This Room</Button>
                </Link>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{room.floor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>Up to {room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
                  </div>
                  {room.hasAV && (
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>AV Equipment included</span>
                    </div>
                  )}
                </div>

                {room.tenantsOnly && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-700">This room is available to tenants only.</p>
                  </div>
                )}

                {room.adminManaged && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600">This resource is admin-managed. Bookings are arranged through reception.</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-gray-900">Cancellation Policy</h3></CardHeader>
              <CardBody className="space-y-2 text-xs text-gray-600">
                <p><strong className="text-green-700">2+ days notice:</strong> Full refund</p>
                <p><strong className="text-yellow-700">&lt;2 days notice:</strong> 50% charge</p>
                <p><strong className="text-red-700">No-show:</strong> Full charge applies</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
