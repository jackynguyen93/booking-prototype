'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockRooms } from '@/data/rooms';
import { calculatePrice, getBookingHours, AV_INDUCTION_NOTICE } from '@/lib/businessRules';
import {
  formatCurrency, generateId, generateBookingRef, generateAccessCode,
  minutesToTime, timeToMinutes,
} from '@/lib/utils';
import { Booking } from '@/types';
import { Check, ChevronRight, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';

const STEPS = ['Select Time', 'Review', 'Terms & Conditions', 'Payment', 'Confirmation'];
const SLOT_HEIGHT = 48; // px per 30-min slot

function BookRoomPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { bookings, addBooking, addNotification } = useApp();

  const room = mockRooms.find(r => r.id === params.id);

  const [step, setStep] = useState(0);
  const [date, setDate] = useState(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));

  // Confirmed selection (persists after drag ends)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  // Live drag state
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);

  // Booking flow state
  const [accepted, setAccepted] = useState(false);
  const [notes, setNotes] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [paypalLoading, setPaypalLoading] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  // Store takenSlots in a ref so the global mouseup handler always sees the latest value
  const takenSlotsRef = useRef(new Set<number>());

  if (!room || !currentUser) return null;

  const hours = getBookingHours(currentUser.role);
  const totalSlots = (hours.end - hours.start) * 2;
  const slots: string[] = [];
  for (let i = 0; i < totalSlots; i++) {
    slots.push(minutesToTime(hours.start * 60 + i * 30));
  }

  // Compute which slots are already booked on the selected date
  const takenSlots = new Set<number>();
  const roomBookings = bookings.filter(
    b => b.roomId === room.id && b.date === date && b.status !== 'CANCELLED'
  );
  roomBookings.forEach(b => {
    const startMin = timeToMinutes(b.startTime);
    const endMin = timeToMinutes(b.endTime);
    for (let min = startMin; min < endMin; min += 30) {
      const idx = (min - hours.start * 60) / 30;
      if (idx >= 0 && idx < totalSlots) takenSlots.add(idx);
    }
  });
  takenSlotsRef.current = takenSlots;

  // Visual range shown while dragging or after selection
  const activeRange =
    isDragging && dragStart !== null && dragCurrent !== null
      ? { start: Math.min(dragStart, dragCurrent), end: Math.max(dragStart, dragCurrent) }
      : selectedRange;

  const rangeHasConflict = (r: { start: number; end: number }) =>
    Array.from({ length: r.end - r.start + 1 }, (_, i) => r.start + i).some(i => takenSlots.has(i));

  const dragConflict = activeRange && isDragging && rangeHasConflict(activeRange);

  // Derived booking values from confirmed selection
  const startTime = selectedRange ? slots[selectedRange.start] : '';
  const endTime = selectedRange
    ? minutesToTime(timeToMinutes(slots[selectedRange.end]) + 30)
    : '';
  const duration = selectedRange ? (selectedRange.end - selectedRange.start + 1) * 0.5 : 0;
  const totalPrice = calculatePrice(room, duration);

  // Reset selection when date changes
  useEffect(() => {
    setSelectedRange(null);
    setDragStart(null);
    setDragCurrent(null);
    setIsDragging(false);
  }, [date]);

  // Global mouseup — finalize drag selection
  useEffect(() => {
    const onMouseUp = () => {
      if (isDragging && dragStart !== null && dragCurrent !== null) {
        const start = Math.min(dragStart, dragCurrent);
        const end = Math.max(dragStart, dragCurrent);
        const hasConflict = Array.from({ length: end - start + 1 }, (_, i) => start + i).some(
          i => takenSlotsRef.current.has(i)
        );
        if (!hasConflict) setSelectedRange({ start, end });
      }
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [isDragging, dragStart, dragCurrent]);

  // Scroll to current time (or business start) on mount / date change
  useEffect(() => {
    if (!calendarRef.current) return;
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const targetSlot =
      date === todayStr
        ? Math.max(0, Math.floor((now.getHours() * 60 + now.getMinutes() - hours.start * 60) / 30) - 2)
        : 0;
    calendarRef.current.scrollTop = targetSlot * SLOT_HEIGHT;
  }, [date]);

  // Mouse handlers for the calendar grid
  const onSlotMouseDown = (i: number) => {
    if (takenSlots.has(i)) return;
    setDragStart(i);
    setDragCurrent(i);
    setIsDragging(true);
    setSelectedRange(null);
  };

  const onSlotMouseEnter = (i: number) => {
    setHoverSlot(i);
    if (!isDragging) return;
    if (!takenSlots.has(i)) setDragCurrent(i);
  };

  // Touch handlers
  const slotFromTouch = (clientY: number): number | null => {
    if (!calendarRef.current) return null;
    const rect = calendarRef.current.getBoundingClientRect();
    const y = clientY - rect.top + calendarRef.current.scrollTop;
    const i = Math.floor(y / SLOT_HEIGHT);
    return i >= 0 && i < totalSlots ? i : null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const i = slotFromTouch(e.touches[0].clientY);
    if (i === null || takenSlots.has(i)) return;
    e.preventDefault();
    setDragStart(i);
    setDragCurrent(i);
    setIsDragging(true);
    setSelectedRange(null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const i = slotFromTouch(e.touches[0].clientY);
    if (i !== null && !takenSlots.has(i)) setDragCurrent(i);
  };

  const onTouchEnd = () => {
    if (isDragging && dragStart !== null && dragCurrent !== null) {
      const start = Math.min(dragStart, dragCurrent);
      const end = Math.max(dragStart, dragCurrent);
      if (!rangeHasConflict({ start, end })) setSelectedRange({ start, end });
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Current-time indicator
  const now = new Date();
  const isToday = date === format(now, 'yyyy-MM-dd');
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMinutes - hours.start * 60) / 30) * SLOT_HEIGHT;
  const showNowLine = isToday && nowMinutes > hours.start * 60 && nowMinutes < hours.end * 60;

  // Confirm booking
  const handleConfirmBooking = async () => {
    setPaypalLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const ref = generateBookingRef();
    const code = generateAccessCode();
    setBookingRef(ref);
    setAccessCode(code);
    const newBooking: Booking = {
      id: generateId(),
      roomId: room.id,
      userId: currentUser.id,
      orgId: currentUser.orgId,
      date,
      startTime,
      endTime,
      status: 'CONFIRMED',
      totalPrice,
      accessCode: code,
      notes,
      createdAt: new Date().toISOString(),
    };
    addBooking(newBooking);
    addNotification({
      id: generateId(),
      userId: currentUser.id,
      type: 'BOOKING_CONFIRMATION',
      title: `Booking Confirmed — ${room.name}`,
      body: `Your booking for ${room.name} on ${date} at ${startTime}–${endTime} is confirmed. Ref: ${ref}, Access: ${code}`,
      read: false,
      createdAt: new Date().toISOString(),
      link: '/dashboard/bookings',
    });
    setPaypalLoading(false);
    setStep(4);
  };

  const isFacilityUser = currentUser.role === 'FACILITY_USER';

  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 shrink-0 ${
            i < step ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
            : i === step ? 'border-[#1e3a5f] text-[#1e3a5f]'
            : 'border-gray-200 text-gray-300'
          }`}>
            {i < step ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-[#1e3a5f]' : 'text-gray-400'}`}>{s}</span>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Book {room.name}</h1>
          <p className="text-gray-500">
            {room.floor} · {room.capacity} person{room.capacity !== 1 ? 's' : ''} ·{' '}
            {room.pricePerHour === 0 ? 'Free' : `${formatCurrency(room.pricePerHour)}/hr`}
          </p>
        </div>

        <StepIndicator />

        {/* ── Step 0: Calendar day view ── */}
        {step === 0 && (
          <Card>
            <CardBody className="p-0 overflow-hidden space-y-0">

              {/* Date picker + day label */}
              <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">
                    {format(new Date(date + 'T12:00:00'), 'EEEE')}
                  </p>
                  <p className="text-sm text-gray-400">
                    {format(new Date(date + 'T12:00:00'), 'd MMMM yyyy')}
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#1e3a5f] inline-block" /> Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500 inline-block" /> Your selection
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" /> Unavailable
                </span>
                <span className="ml-auto italic text-gray-400 hidden sm:inline">
                  Click and drag to select a time range
                </span>
              </div>

              {/* ── Calendar grid ── */}
              <div
                ref={calendarRef}
                className="overflow-y-auto select-none"
                style={{ maxHeight: 520, cursor: isDragging ? 'grabbing' : 'crosshair' }}
                onMouseLeave={() => setHoverSlot(null)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="relative flex" style={{ height: totalSlots * SLOT_HEIGHT }}>

                  {/* ── Time axis ── */}
                  <div className="w-16 shrink-0 border-r border-gray-200 bg-white z-10">
                    {slots.map((slot, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-end pr-2 pt-1"
                        style={{ height: SLOT_HEIGHT }}
                      >
                        {/* Label every full hour */}
                        {i % 2 === 0 && (
                          <span className="text-xs text-gray-400 font-medium leading-none tabular-nums">
                            {slot}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Slots column ── */}
                  <div className="flex-1 relative">

                    {/* Grid row lines + mouse targets */}
                    {slots.map((_, i) => (
                      <div
                        key={i}
                        className={`absolute left-0 right-0 border-b ${
                          i % 2 === 0 ? 'border-gray-200' : 'border-gray-100 border-dashed'
                        }`}
                        style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                        onMouseDown={() => onSlotMouseDown(i)}
                        onMouseEnter={() => onSlotMouseEnter(i)}
                      />
                    ))}

                    {/* Taken slot shading */}
                    {Array.from(takenSlots).map(i => (
                      <div
                        key={`taken-${i}`}
                        className="absolute left-0 right-0 bg-gray-50 pointer-events-none"
                        style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      />
                    ))}

                    {/* Existing bookings */}
                    {roomBookings.map(booking => {
                      const startMin = timeToMinutes(booking.startTime) - hours.start * 60;
                      const endMin = timeToMinutes(booking.endTime) - hours.start * 60;
                      if (startMin < 0 || endMin <= 0) return null;
                      const top = (startMin / 30) * SLOT_HEIGHT;
                      const height = ((endMin - startMin) / 30) * SLOT_HEIGHT;
                      return (
                        <div
                          key={booking.id}
                          className="absolute left-1 right-1 bg-[#1e3a5f] text-white rounded-md px-2 overflow-hidden pointer-events-none z-10"
                          style={{ top: top + 2, height: Math.max(height - 4, 24) }}
                        >
                          <p className="text-xs font-semibold mt-1 leading-tight truncate">
                            {booking.startTime}–{booking.endTime}
                          </p>
                          {height > 48 && (
                            <p className="text-xs opacity-60">Booked</p>
                          )}
                        </div>
                      );
                    })}

                    {/* Drag / confirmed selection overlay */}
                    {activeRange && (
                      <div
                        className={`absolute left-1 right-1 rounded-md px-2 pointer-events-none z-20 ${
                          dragConflict
                            ? 'bg-red-100/70 border-2 border-red-400'
                            : isDragging
                            ? 'bg-blue-400/25 border-2 border-blue-500'
                            : 'bg-blue-500/20 border-2 border-blue-600'
                        }`}
                        style={{
                          top: activeRange.start * SLOT_HEIGHT + 2,
                          height: (activeRange.end - activeRange.start + 1) * SLOT_HEIGHT - 4,
                        }}
                      >
                        <p className={`text-xs font-bold mt-1 leading-tight ${
                          dragConflict ? 'text-red-600' : 'text-blue-700'
                        }`}>
                          {slots[activeRange.start]}
                          {' – '}
                          {minutesToTime(timeToMinutes(slots[activeRange.end]) + 30)}
                        </p>
                        {!dragConflict && (
                          <p className="text-xs text-blue-600">
                            {(activeRange.end - activeRange.start + 1) * 0.5}h
                            {' · '}
                            {calculatePrice(room, (activeRange.end - activeRange.start + 1) * 0.5) === 0
                              ? 'Free'
                              : formatCurrency(calculatePrice(room, (activeRange.end - activeRange.start + 1) * 0.5))
                            }
                          </p>
                        )}
                        {dragConflict && (
                          <p className="text-xs text-red-500">Overlaps existing booking</p>
                        )}
                      </div>
                    )}

                    {/* Hover ghost highlight */}
                    {hoverSlot !== null && !isDragging && !takenSlots.has(hoverSlot) && !activeRange && (
                      <div
                        className="absolute left-0 right-0 bg-blue-50/60 pointer-events-none"
                        style={{ top: hoverSlot * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      />
                    )}

                    {/* Current time line */}
                    {showNowLine && (
                      <div
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                        style={{ top: nowTop }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Selection summary + actions ── */}
              <div className="px-6 py-5 space-y-4 border-t border-gray-100">
                {selectedRange ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        {slots[selectedRange.start]}
                        {' – '}
                        {minutesToTime(timeToMinutes(slots[selectedRange.end]) + 30)}
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        {duration} hour{duration !== 1 ? 's' : ''}
                        {' · '}
                        {totalPrice === 0 ? 'Free' : formatCurrency(totalPrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRange(null)}
                      className="text-blue-400 hover:text-blue-600 p-1 rounded"
                      title="Clear selection"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-1 italic">
                    No time selected — drag on the calendar to choose a time range
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Room setup requirements, special instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep(1)} disabled={!selectedRange}>
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── Step 1: Review ── */}
        {step === 1 && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Booking Summary</h2>
              <div className="space-y-3 text-sm">
                {[
                  ['Room', room.name],
                  ['Floor', room.floor],
                  ['Date', format(new Date(date + 'T12:00:00'), 'EEEE d MMMM yyyy')],
                  ['Start Time', startTime],
                  ['End Time', endTime],
                  ['Duration', `${duration} hour${duration !== 1 ? 's' : ''}`],
                  ['Total Price', totalPrice === 0 ? 'Free' : formatCurrency(totalPrice)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
              {room.hasAV && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">AV Induction Required</p>
                      <p className="text-xs text-amber-600 mt-1">{AV_INDUCTION_NOTICE}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={() => setStep(2)}>Continue <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── Step 2: Terms ── */}
        {step === 2 && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Terms & Conditions</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2 max-h-64 overflow-y-auto">
                <p className="font-semibold">Cancellation Policy</p>
                <p>• 2+ days notice: Full refund</p>
                <p>• Less than 2 days notice: 50% cancellation charge</p>
                <p>• No-show: Full charge applies</p>
                <br />
                <p className="font-semibold">Terms of Use</p>
                <p>• Rooms must be left clean and tidy after each booking</p>
                <p>• AV equipment must be handled with care — report any damage immediately</p>
                <p>• Any damage to the room or equipment will be charged to the booking organisation</p>
                <p>• Noise levels must be kept reasonable at all times</p>
                <p>• Bookings cannot be transferred to other organisations</p>
                <p>• Ross House staff may need access to rooms in case of emergency</p>
                <p>• Maximum occupancy must not exceed the stated capacity</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the Terms & Conditions and Cancellation Policy
                </span>
              </label>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                <Button onClick={() => setStep(3)} disabled={!accepted}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 3 && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">{room.name} × {duration}hr</span>
                  <span className="font-medium">{totalPrice === 0 ? 'Free' : formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{totalPrice === 0 ? 'Free' : formatCurrency(totalPrice)}</span>
                </div>
              </div>
              {totalPrice === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                  This room is complimentary for tenants. No payment required.
                </div>
              ) : isFacilityUser ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Pay securely via PayPal to confirm your booking.</p>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={paypalLoading}
                    className="w-full bg-[#003087] hover:bg-[#002b78] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                  >
                    {paypalLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-[#009cde] font-extrabold italic text-xl">Pay</span>
                        <span className="text-white font-extrabold italic text-xl">Pal</span>
                        <span className="text-sm ml-1">— Pay {formatCurrency(totalPrice)}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-700">Invoice to Organisation</p>
                    <p className="text-sm text-blue-600 mt-1">
                      This booking will be invoiced to your organisation at the end of the month.
                      No payment required now.
                    </p>
                  </div>
                  <Button onClick={handleConfirmBooking} loading={paypalLoading} className="w-full" size="lg">
                    Confirm Booking
                  </Button>
                </div>
              )}
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            </CardBody>
          </Card>
        )}

        {/* ── Step 4: Confirmation ── */}
        {step === 4 && (
          <Card>
            <CardBody className="text-center space-y-6 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
                <p className="text-gray-500 mt-1">Your room has been booked successfully.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 text-sm max-w-sm mx-auto">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Booking Reference</p>
                  <p className="text-2xl font-bold text-[#1e3a5f] font-mono">{bookingRef}</p>
                </div>
                {[
                  ['Room', room.name],
                  ['Date', format(new Date(date + 'T12:00:00'), 'EEEE d MMMM yyyy')],
                  ['Time', `${startTime} – ${endTime}`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-1">Access Code</p>
                  <p className="text-2xl font-bold font-mono text-center text-gray-900 tracking-widest">
                    {accessCode}
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-1">Use this code to access the room</p>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => router.push('/dashboard/bookings')}>
                  View My Bookings
                </Button>
                <Button onClick={() => router.push('/dashboard/rooms')}>
                  Book Another Room
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}

export default function BookRoomPage() {
  return (
    <Suspense>
      <BookRoomPageInner />
    </Suspense>
  );
}
