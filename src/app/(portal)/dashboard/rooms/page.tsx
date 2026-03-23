'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockRooms } from '@/data/rooms';
import { canAccessRoom, getBookingHours } from '@/lib/businessRules';
import { formatCurrency, timeToMinutes } from '@/lib/utils';
import { Users, Monitor, DollarSign, MapPin, Search, LayoutList, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  format, addDays, subDays,
  addWeeks, subWeeks,
  addMonths, subMonths,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  eachDayOfInterval,
  isSameMonth, isSameDay,
} from 'date-fns';
import { useRouter } from 'next/navigation';

// Standard bookable time slots used for availability calculation
const STANDARD_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

const SLOT_HEIGHT = 40; // px per 30-min row

function isSlotBooked(
  roomBookings: { date: string; startTime: string; endTime: string; status: string }[],
  date: string,
  slotTime: string,
): boolean {
  const slotMin = timeToMinutes(slotTime);
  return roomBookings.some(b => {
    if (b.date !== date || b.status === 'CANCELLED') return false;
    const startMin = timeToMinutes(b.startTime);
    const endMin = timeToMinutes(b.endTime);
    return slotMin >= startMin && slotMin < endMin;
  });
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function generateHalfHourSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${pad2(h)}:00`);
    slots.push(`${pad2(h)}:30`);
  }
  return slots;
}

interface BookingBlock {
  startTime: string;
  endTime: string;
  status: string;
}

function getBookingBlocks(
  roomBookings: { date: string; startTime: string; endTime: string; status: string }[],
  date: string,
): BookingBlock[] {
  return roomBookings
    .filter(b => b.date === date && b.status !== 'CANCELLED')
    .map(b => ({ startTime: b.startTime, endTime: b.endTime, status: b.status }));
}

// Extract a CSS color name from a Tailwind bg class like "bg-blue-200" → "blue"
function colorNameFromClass(colorClass: string): string {
  const match = colorClass.match(/bg-(\w+)-/);
  return match ? match[1] : 'gray';
}

// Map color name to solid pill bg/text for week/month booking pills
const COLOR_PILL: Record<string, string> = {
  blue:   'bg-blue-200 text-blue-900 border-blue-400',
  green:  'bg-green-200 text-green-900 border-green-400',
  purple: 'bg-purple-200 text-purple-900 border-purple-400',
  orange: 'bg-orange-200 text-orange-900 border-orange-400',
  red:    'bg-red-200 text-red-900 border-red-400',
  yellow: 'bg-yellow-200 text-yellow-900 border-yellow-400',
  pink:   'bg-pink-200 text-pink-900 border-pink-400',
  gray:   'bg-gray-200 text-gray-800 border-gray-400',
};

function pillClass(colorClass: string): string {
  const name = colorNameFromClass(colorClass);
  return COLOR_PILL[name] ?? COLOR_PILL['gray'];
}

type ViewMode = 'list' | 'day' | 'week' | 'month';

export default function RoomsPage() {
  const { currentUser } = useAuth();
  const { bookings } = useApp();
  const router = useRouter();
  const [capacityFilter, setCapacityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // Sync dateFilter <-> calendarDate
  const handleDateFilterChange = (val: string) => {
    setDateFilter(val);
    if (val) {
      setCalendarDate(new Date(val + 'T12:00:00'));
    }
  };

  const handleCalendarDateChange = (newDate: Date) => {
    setCalendarDate(newDate);
    setDateFilter(format(newDate, 'yyyy-MM-dd'));
  };

  // Scroll calendar to current time on mount / date change (day + week only)
  useEffect(() => {
    if (viewMode !== 'day' && viewMode !== 'week') return;
    const el = calendarScrollRef.current;
    if (!el) return;
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const calStr = format(calendarDate, 'yyyy-MM-dd');
    if (viewMode === 'day' && todayStr === calStr) {
      const minutes = now.getHours() * 60 + now.getMinutes();
      const startMin = bookingHours.start * 60;
      const offsetPx = ((minutes - startMin) / 30) * SLOT_HEIGHT - 80;
      el.scrollTop = Math.max(0, offsetPx);
    } else if (viewMode === 'week') {
      // Scroll to current time for week view (today is always visible if in the week)
      const minutes = now.getHours() * 60 + now.getMinutes();
      const startMin = bookingHours.start * 60;
      const offsetPx = ((minutes - startMin) / 30) * SLOT_HEIGHT - 80;
      el.scrollTop = Math.max(0, offsetPx);
    } else {
      el.scrollTop = 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, calendarDate]);

  if (!currentUser) return null;

  const bookingHours = getBookingHours(currentUser.role);
  const calSlots = generateHalfHourSlots(bookingHours.start, bookingHours.end);

  const accessibleRooms = mockRooms.filter(room => canAccessRoom(room, currentUser.role));

  const filteredRooms = accessibleRooms.filter(room => {
    if (capacityFilter && room.capacity < parseInt(capacityFilter)) return false;
    if (search && !room.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  const getBookingsCount = (roomId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return bookings.filter(b => b.roomId === roomId && b.status === 'CONFIRMED' && b.date >= today).length;
  };

  // Availability for selected date
  const getDateAvailability = (roomId: string): { bookedSlots: number; totalSlots: number } | null => {
    if (!dateFilter) return null;
    const roomBookings = bookings.filter(b => b.roomId === roomId);
    const bookedSlots = STANDARD_SLOTS.filter(slot => isSlotBooked(roomBookings, dateFilter, slot)).length;
    return { bookedSlots, totalSlots: STANDARD_SLOTS.length };
  };

  const isFullyBooked = (roomId: string): boolean => {
    const avail = getDateAvailability(roomId);
    if (!avail) return false;
    return avail.bookedSlots >= avail.totalSlots;
  };

  // ---- Calendar helpers ----
  const calDateStr = format(calendarDate, 'yyyy-MM-dd');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isToday = calDateStr === todayStr;

  // Current time position in px (only meaningful for today)
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = bookingHours.start * 60;
  const nowOffsetPx = ((nowMinutes - startMin) / 30) * SLOT_HEIGHT;

  // ---- Week view helpers ----
  const weekStart = startOfWeek(calendarDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(calendarDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // ---- Month view helpers ----
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const calGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calGridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthGridDays = eachDayOfInterval({ start: calGridStart, end: calGridEnd });

  // Get all bookings for a given date across all accessible rooms (for week/month)
  interface DayBookingSummary {
    roomName: string;
    colorClass: string;
    startTime: string;
    endTime: string;
  }
  function getBookingsForDate(dateStr: string): DayBookingSummary[] {
    const result: DayBookingSummary[] = [];
    for (const room of filteredRooms) {
      const roomBookings = bookings.filter(b => b.roomId === room.id && b.date === dateStr && b.status !== 'CANCELLED');
      for (const b of roomBookings) {
        result.push({ roomName: room.name, colorClass: room.colorClass, startTime: b.startTime, endTime: b.endTime });
      }
    }
    return result;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book a Room</h1>
            <p className="text-gray-500">Browse and book available rooms at Ross House</p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutList className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setViewMode(prev => prev === 'list' ? 'day' : prev)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode !== 'list'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Calendar
              </button>
            </div>

            {/* Sub-toggle: Day / Week / Month (only in calendar modes) */}
            {viewMode !== 'list' && (
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                {(['day', 'week', 'month'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 text-sm font-medium transition-colors capitalize ${
                      viewMode === mode
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search rooms..."
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={e => handleDateFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Capacity</label>
              <select
                value={capacityFilter}
                onChange={e => setCapacityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <option value="">Any</option>
                <option value="4">4+</option>
                <option value="6">6+</option>
                <option value="8">8+</option>
                <option value="12">12+</option>
                <option value="20">20+</option>
              </select>
            </div>
          </div>
          {dateFilter && (
            <p className="text-xs text-gray-400 mt-2">
              Showing availability for {format(new Date(dateFilter + 'T12:00:00'), 'd MMM yyyy')}
            </p>
          )}
        </div>

        {/* ---- LIST VIEW ---- */}
        {viewMode === 'list' && (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRooms.map(room => {
                const avail = getDateAvailability(room.id);
                const fullyBooked = isFullyBooked(room.id);

                return (
                  <Card key={room.id} className={`overflow-hidden hover:shadow-md transition-shadow ${fullyBooked ? 'opacity-60' : ''}`}>
                    {/* Room color banner */}
                    <div className={`h-32 ${room.colorClass} flex items-center justify-center relative`}>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-600 opacity-50">{room.capacity > 1 ? room.capacity : ''}</p>
                        {room.capacity > 1 && <p className="text-xs text-gray-500 opacity-70">capacity</p>}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 flex-wrap justify-end">
                        {room.hasAV && <Badge variant="info">AV</Badge>}
                        {room.tenantsOnly && <Badge variant="warning">Tenants</Badge>}
                        {room.pricePerHour === 0 && <Badge variant="success">Free</Badge>}
                        {avail && (
                          fullyBooked
                            ? <Badge variant="danger">Fully Booked</Badge>
                            : avail.bookedSlots === 0
                            ? <Badge variant="success">Available</Badge>
                            : <Badge variant="warning">Busy {avail.bookedSlots} slot{avail.bookedSlots !== 1 ? 's' : ''}</Badge>
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline">{getRoomTypeLabel(room.type)}</Badge>
                      </div>
                    </div>

                    <CardBody className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{room.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{room.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
                        {room.hasAV && <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> AV Equipped</span>}
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {room.floor}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <span className="flex items-center gap-1 text-lg font-bold text-gray-900">
                            <DollarSign className="h-4 w-4" />
                            {room.pricePerHour === 0 ? 'Free' : `${formatCurrency(room.pricePerHour)}/hr`}
                          </span>
                          {room.priceCapHours && (
                            <p className="text-xs text-gray-400">Max {formatCurrency(room.pricePerHour * room.priceCapHours)}/day</p>
                          )}
                          <p className="text-xs text-gray-400">{getBookingsCount(room.id)} upcoming bookings</p>
                        </div>
                        <Link href={`/dashboard/rooms/${room.id}`}>
                          <Button disabled={fullyBooked}>{fullyBooked ? 'Fully Booked' : 'View & Book'}</Button>
                        </Link>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            {filteredRooms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No rooms match your search criteria.</p>
                <Button variant="ghost" onClick={() => { setSearch(''); setCapacityFilter(''); setDateFilter(''); }} className="mt-2">
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}

        {/* ---- DAY VIEW ---- */}
        {viewMode === 'day' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Date navigation header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => handleCalendarDateChange(subDays(calendarDate, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-[#1e3a5f] min-w-[140px] text-center">
                {isToday ? 'Today — ' : ''}{format(calendarDate, 'EEEE, d MMM yyyy')}
              </span>
              <button
                onClick={() => handleCalendarDateChange(addDays(calendarDate, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {!isToday && (
                <button
                  onClick={() => handleCalendarDateChange(new Date())}
                  className="ml-2 text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            {filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No rooms match your search criteria.</p>
                <Button variant="ghost" onClick={() => { setSearch(''); setCapacityFilter(''); setDateFilter(''); }} className="mt-2">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Column header row (sticky) */}
                <div
                  className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10"
                  style={{ minWidth: `${56 + filteredRooms.length * 160}px` }}
                >
                  <div className="shrink-0 w-14" />
                  {filteredRooms.map(room => (
                    <div
                      key={room.id}
                      className="flex-1 min-w-[160px] px-2 py-2 border-l border-gray-200 text-center"
                    >
                      <p className="text-xs font-semibold text-[#1e3a5f] truncate" title={room.name}>
                        {room.name}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
                          <Users className="h-3 w-3" />{room.capacity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {room.pricePerHour === 0 ? 'Free' : `${formatCurrency(room.pricePerHour)}/hr`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scrollable grid body */}
                <div
                  ref={calendarScrollRef}
                  className="overflow-y-auto relative"
                  style={{ maxHeight: '500px', minWidth: `${56 + filteredRooms.length * 160}px` }}
                >
                  {/* Current time indicator (today only) */}
                  {isToday && nowOffsetPx >= 0 && nowOffsetPx <= calSlots.length * SLOT_HEIGHT && (
                    <div
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{ top: `${nowOffsetPx}px` }}
                    >
                      <div className="w-14 flex justify-end pr-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -mr-[5px] shrink-0" />
                      </div>
                      <div className="flex-1 border-t-2 border-red-500" />
                    </div>
                  )}

                  {/* Rows */}
                  {calSlots.map(slot => {
                    const isHourMark = slot.endsWith(':00');
                    return (
                      <div
                        key={slot}
                        className="flex"
                        style={{ height: `${SLOT_HEIGHT}px`, minWidth: `${56 + filteredRooms.length * 160}px` }}
                      >
                        {/* Time label */}
                        <div className="shrink-0 w-14 flex items-start justify-end pr-2 pt-0.5">
                          {isHourMark && (
                            <span className="text-[10px] text-gray-400 font-medium leading-none">
                              {slot}
                            </span>
                          )}
                        </div>

                        {/* Room cells */}
                        {filteredRooms.map(room => {
                          const roomBookings = bookings.filter(b => b.roomId === room.id);
                          const slotBooked = isSlotBooked(roomBookings, calDateStr, slot);

                          const blockStartingHere = getBookingBlocks(roomBookings, calDateStr).find(
                            b => b.startTime === slot
                          );

                          let blockHeightPx = 0;
                          let blockLabel = '';
                          if (blockStartingHere) {
                            const durationMins = timeToMinutes(blockStartingHere.endTime) - timeToMinutes(blockStartingHere.startTime);
                            blockHeightPx = (durationMins / 30) * SLOT_HEIGHT;
                            blockLabel = `${blockStartingHere.startTime}–${blockStartingHere.endTime}`;
                          }

                          return (
                            <div
                              key={room.id}
                              className={`flex-1 min-w-[160px] border-l border-gray-100 relative ${
                                isHourMark ? 'border-t border-gray-200' : 'border-t border-gray-100'
                              }`}
                            >
                              {blockStartingHere && blockHeightPx > 0 && (
                                <div
                                  className="absolute left-1 right-1 z-10 rounded overflow-hidden"
                                  style={{ top: 2, height: blockHeightPx - 4 }}
                                >
                                  <div className="w-full h-full bg-[#1e3a5f] rounded px-1.5 py-1 flex flex-col justify-start overflow-hidden">
                                    {blockHeightPx >= 30 && (
                                      <span className="text-[10px] text-white font-medium leading-tight truncate">
                                        {blockLabel}
                                      </span>
                                    )}
                                    {blockHeightPx >= 50 && (
                                      <span className="text-[10px] text-blue-200 leading-tight truncate">Booked</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {!slotBooked ? (
                                <button
                                  className="absolute inset-0 w-full h-full hover:bg-blue-50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    router.push(
                                      `/dashboard/rooms/${room.id}/book?date=${calDateStr}&startTime=${encodeURIComponent(slot)}`
                                    );
                                  }}
                                  title={`Book ${room.name} at ${slot}`}
                                />
                              ) : (
                                !blockStartingHere && (
                                  <div className="absolute inset-0 bg-gray-100 cursor-not-allowed" />
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- WEEK VIEW ---- */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Week navigation header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => handleCalendarDateChange(subWeeks(calendarDate, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-[#1e3a5f] min-w-[220px] text-center">
                {format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM yyyy')}
              </span>
              <button
                onClick={() => handleCalendarDateChange(addWeeks(calendarDate, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Next week"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleCalendarDateChange(new Date())}
                className="ml-2 text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                This Week
              </button>
            </div>

            <div className="overflow-x-auto">
              {/* Column header row: time gutter + 7 day columns */}
              <div
                className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10"
                style={{ minWidth: `${56 + 7 * 120}px` }}
              >
                <div className="shrink-0 w-14" />
                {weekDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isDayToday = dayStr === todayStr;
                  return (
                    <div
                      key={dayStr}
                      className={`flex-1 min-w-[120px] px-1 py-2 border-l border-gray-200 text-center ${isDayToday ? 'bg-blue-50' : ''}`}
                    >
                      <p className={`text-[10px] font-medium uppercase tracking-wide ${isDayToday ? 'text-blue-600' : 'text-gray-500'}`}>
                        {format(day, 'EEE')}
                      </p>
                      <p className={`text-sm font-bold ${isDayToday ? 'text-blue-700' : 'text-gray-800'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Scrollable week grid */}
              <div
                ref={calendarScrollRef}
                className="overflow-y-auto relative"
                style={{ maxHeight: '500px', minWidth: `${56 + 7 * 120}px` }}
              >
                {/* Current time indicator — spans all columns, only shown if today is in the week */}
                {weekDays.some(d => format(d, 'yyyy-MM-dd') === todayStr) && nowOffsetPx >= 0 && nowOffsetPx <= calSlots.length * SLOT_HEIGHT && (
                  (() => {
                    const todayIdx = weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === todayStr);
                    const gutterW = 56;
                    const colW = 120;
                    const leftPx = gutterW + todayIdx * colW;
                    return (
                      <div
                        className="absolute z-20 flex items-center pointer-events-none"
                        style={{ top: `${nowOffsetPx}px`, left: `${leftPx}px`, width: `${colW}px` }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[5px] shrink-0" />
                        <div className="flex-1 border-t-2 border-red-500" />
                      </div>
                    );
                  })()
                )}

                {calSlots.map(slot => {
                  const isHourMark = slot.endsWith(':00');
                  return (
                    <div
                      key={slot}
                      className="flex"
                      style={{ height: `${SLOT_HEIGHT}px`, minWidth: `${56 + 7 * 120}px` }}
                    >
                      {/* Time label */}
                      <div className="shrink-0 w-14 flex items-start justify-end pr-2 pt-0.5">
                        {isHourMark && (
                          <span className="text-[10px] text-gray-400 font-medium leading-none">{slot}</span>
                        )}
                      </div>

                      {/* Day columns */}
                      {weekDays.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const isDayToday = dayStr === todayStr;

                        // Collect all booking blocks starting at this slot across all filtered rooms
                        const blocksHere: { roomName: string; colorClass: string; endTime: string }[] = [];
                        for (const room of filteredRooms) {
                          const roomBookings = bookings.filter(b => b.roomId === room.id);
                          const blocks = getBookingBlocks(roomBookings, dayStr);
                          const match = blocks.find(b => b.startTime === slot);
                          if (match) {
                            blocksHere.push({ roomName: room.name, colorClass: room.colorClass, endTime: match.endTime });
                          }
                        }

                        // Is any room booked during this slot (for click-through logic)
                        const anyBooked = filteredRooms.some(room => {
                          const rb = bookings.filter(b => b.roomId === room.id);
                          return isSlotBooked(rb, dayStr, slot);
                        });

                        return (
                          <div
                            key={dayStr}
                            className={`flex-1 min-w-[120px] border-l border-gray-100 relative ${
                              isHourMark ? 'border-t border-gray-200' : 'border-t border-gray-100'
                            } ${isDayToday ? 'bg-blue-50/40' : ''}`}
                          >
                            {/* Booking blocks starting at this slot */}
                            {blocksHere.map((block, i) => {
                              const durationMins = timeToMinutes(block.endTime) - timeToMinutes(slot);
                              const blockH = (durationMins / 30) * SLOT_HEIGHT - 4;
                              const pc = pillClass(block.colorClass);
                              return (
                                <div
                                  key={i}
                                  className={`absolute left-0.5 right-0.5 z-10 rounded border text-[9px] font-medium px-1 overflow-hidden ${pc}`}
                                  style={{ top: 2 + i * 2, height: Math.max(blockH, 16) }}
                                  title={`${block.roomName} ${slot}–${block.endTime}`}
                                >
                                  <span className="truncate block leading-tight pt-0.5">{block.roomName}</span>
                                  <span className="truncate block leading-tight opacity-80">{slot}–{block.endTime}</span>
                                </div>
                              );
                            })}

                            {/* Click available slot → switch to day view for that date */}
                            {!anyBooked && (
                              <button
                                className="absolute inset-0 w-full h-full hover:bg-blue-100/50 transition-colors cursor-pointer"
                                onClick={() => {
                                  handleCalendarDateChange(day);
                                  setViewMode('day');
                                }}
                                title={`View ${format(day, 'd MMM')} in day view`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---- MONTH VIEW ---- */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Month navigation header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => handleCalendarDateChange(subMonths(calendarDate, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-[#1e3a5f] min-w-[140px] text-center">
                {format(calendarDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => handleCalendarDateChange(addMonths(calendarDate, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleCalendarDateChange(new Date())}
                className="ml-2 text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                This Month
              </button>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide border-l border-gray-100 first:border-l-0">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {monthGridDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, calendarDate);
                const isDayToday = isSameDay(day, new Date());
                const dayBookings = getBookingsForDate(dayStr);
                const visibleBookings = dayBookings.slice(0, 3);
                const overflow = dayBookings.length - visibleBookings.length;

                return (
                  <button
                    key={dayStr}
                    onClick={() => {
                      setCalendarDate(day);
                      setDateFilter(dayStr);
                      setViewMode('day');
                    }}
                    className={`min-h-[96px] p-1.5 border-b border-l border-gray-100 first:border-l-0 text-left transition-colors hover:bg-blue-50/60 ${
                      !inMonth ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-center mb-1">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isDayToday
                            ? 'bg-[#1e3a5f] text-white'
                            : inMonth
                            ? 'text-gray-800'
                            : 'text-gray-300'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Booking pills */}
                    <div className="space-y-0.5">
                      {visibleBookings.map((b, i) => (
                        <div
                          key={i}
                          className={`text-[9px] font-medium px-1 py-0.5 rounded border truncate leading-tight ${pillClass(b.colorClass)}`}
                          title={`${b.roomName} ${b.startTime}–${b.endTime}`}
                        >
                          {b.roomName}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="text-[9px] text-gray-400 font-medium px-1">+{overflow} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
