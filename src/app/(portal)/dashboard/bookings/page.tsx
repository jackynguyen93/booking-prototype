'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { mockRooms } from '@/data/rooms';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCancellationPolicy } from '@/lib/businessRules';
import { Eye, EyeOff, XCircle } from 'lucide-react';

export default function BookingsPage() {
  const { currentUser } = useAuth();
  const { bookings, cancelBooking } = useApp();
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('ALL');

  if (!currentUser) return null;

  const myBookings = bookings
    .filter(b => b.userId === currentUser.id)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const filtered = filter === 'ALL' ? myBookings : myBookings.filter(b => b.status === filter);

  const getRoomName = (roomId: string) => mockRooms.find(r => r.id === roomId)?.name || roomId;

  const statusVariant = (s: string) => {
    if (s === 'CONFIRMED') return 'success';
    if (s === 'CANCELLED') return 'danger';
    if (s === 'COMPLETED') return 'default';
    return 'info';
  };

  const handleCancel = (bookingId: string) => {
    cancelBooking(bookingId);
    setCancelModal(null);
    toast('Booking cancelled successfully', 'success');
  };

  const toggleCode = (id: string) => {
    setVisibleCodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const cancellingBooking = cancelModal ? myBookings.find(b => b.id === cancelModal) : null;
  const cancelPolicy = cancellingBooking
    ? getCancellationPolicy(cancellingBooking.date, cancellingBooking.startTime)
    : null;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500">View and manage your room bookings</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Access Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{getRoomName(b.roomId)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(b.date)}</td>
                    <td className="px-6 py-4 text-gray-600">{b.startTime} – {b.endTime}</td>
                    <td className="px-6 py-4 text-gray-600">{b.totalPrice === 0 ? 'Free' : formatCurrency(b.totalPrice)}</td>
                    <td className="px-6 py-4"><Badge variant={statusVariant(b.status) as any}>{b.status}</Badge></td>
                    <td className="px-6 py-4">
                      {b.status === 'CONFIRMED' ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{visibleCodes.has(b.id) ? b.accessCode : '••••••'}</span>
                          <button onClick={() => toggleCode(b.id)} className="text-gray-400 hover:text-gray-600">
                            {visibleCodes.has(b.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {b.status === 'CONFIRMED' && b.date >= new Date().toISOString().split('T')[0] && (
                        <Button variant="danger" size="sm" onClick={() => setCancelModal(b.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Booking" size="sm">
        {cancellingBooking && cancelPolicy && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p className="font-medium text-gray-700">{getRoomName(cancellingBooking.roomId)}</p>
              <p className="text-gray-500">{formatDate(cancellingBooking.date)} · {cancellingBooking.startTime}–{cancellingBooking.endTime}</p>
            </div>
            <div className={`rounded-lg p-3 text-sm ${cancelPolicy.refundPercent === 100 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              <p className="font-semibold">Cancellation Policy</p>
              <p className="mt-1">{cancelPolicy.message}</p>
              {cancelPolicy.refundPercent < 100 && (
                <p className="mt-1">Cancellation charge: {formatCurrency(cancellingBooking.totalPrice * 0.5)}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCancelModal(null)} className="flex-1">Keep Booking</Button>
              <Button variant="danger" onClick={() => handleCancel(cancellingBooking.id)} className="flex-1">Confirm Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
