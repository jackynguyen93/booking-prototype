'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { mockRooms } from '@/data/rooms';
import { mockOrganisations } from '@/data/organisations';
import { formatCurrency, formatDate, generateId, generateAccessCode, getDurationHours } from '@/lib/utils';
import { Booking } from '@/types';
import { Plus, XCircle, RefreshCw, Search } from 'lucide-react';

export default function AdminBookingsPage() {
  const { currentUser } = useAuth();
  const { bookings, addBooking, cancelBooking } = useApp();
  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    roomId: mockRooms[0]?.id || 'room1',
    orgId: 'org2',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
  });
  const [recurringForm, setRecurringForm] = useState({
    roomId: 'room1',
    startDate: '2026-03-23',
    startTime: '09:00',
    endTime: '11:00',
    orgId: 'org2',
    frequency: 'weekly',
    endDate: '2026-06-30',
  });

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const getRoomName = (roomId: string) => mockRooms.find(r => r.id === roomId)?.name || roomId;
  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const filtered = bookings.filter(b => {
    if (roomFilter && b.roomId !== roomFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    if (dateFilter && b.date !== dateFilter) return false;
    if (search) {
      const room = getRoomName(b.roomId).toLowerCase();
      const org = getOrgName(b.orgId).toLowerCase();
      if (!room.includes(search.toLowerCase()) && !org.includes(search.toLowerCase()) && !b.id.includes(search)) return false;
    }
    return true;
  }).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const statusVariant = (s: string) => {
    if (s === 'CONFIRMED') return 'success';
    if (s === 'CANCELLED') return 'danger';
    if (s === 'COMPLETED') return 'default';
    if (s === 'PENDING_APPROVAL') return 'warning';
    return 'info';
  };

  const handleCreate = async () => {
    const room = mockRooms.find(r => r.id === createForm.roomId);
    if (!room) return;
    if (createForm.startTime >= createForm.endTime) {
      toast('End time must be after start time', 'error');
      return;
    }
    setCreating(true);
    await new Promise(r => setTimeout(r, 600));
    const duration = getDurationHours(createForm.startTime, createForm.endTime);
    const price = Math.min(room.pricePerHour * duration, room.priceCapHours ? room.pricePerHour * room.priceCapHours : Infinity);
    const booking: Booking = {
      id: generateId(),
      roomId: createForm.roomId,
      userId: currentUser.id,
      orgId: createForm.orgId,
      date: createForm.date,
      startTime: createForm.startTime,
      endTime: createForm.endTime,
      status: 'CONFIRMED',
      totalPrice: price,
      accessCode: generateAccessCode(),
      createdAt: new Date().toISOString(),
    };
    addBooking(booking);
    setCreating(false);
    setShowCreateModal(false);
    toast(`Booking created for ${getRoomName(createForm.roomId)} on ${createForm.date}`, 'success');
  };

  const handleCreateRecurring = async () => {
    setCreating(true);
    await new Promise(r => setTimeout(r, 800));

    const room = mockRooms.find(r => r.id === recurringForm.roomId);
    if (!room) { setCreating(false); return; }

    const groupId = generateId();
    let currentDate = new Date(recurringForm.startDate + 'T12:00:00');
    const endDate = new Date(recurringForm.endDate + 'T12:00:00');
    let count = 0;
    const duration = getDurationHours(recurringForm.startTime, recurringForm.endTime);

    while (currentDate <= endDate && count < 52) {
      const dateStr = currentDate.toISOString().split('T')[0];
      addBooking({
        id: generateId(),
        roomId: recurringForm.roomId,
        userId: currentUser.id,
        orgId: recurringForm.orgId,
        date: dateStr,
        startTime: recurringForm.startTime,
        endTime: recurringForm.endTime,
        status: 'CONFIRMED',
        totalPrice: room.pricePerHour * duration,
        accessCode: generateAccessCode(),
        createdAt: new Date().toISOString(),
        isRecurring: true,
        recurringGroupId: groupId,
      });

      if (recurringForm.frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (recurringForm.frequency === 'fortnightly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      count++;
    }

    setCreating(false);
    setShowRecurringModal(false);
    toast(`${count} recurring bookings created`, 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
            <p className="text-gray-500">{filtered.length} of {bookings.length} bookings shown</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRecurringModal(true)}>
              <RefreshCw className="h-4 w-4" /> Create Recurring
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" /> Create Booking
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by room, org..." className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          />
          <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            <option value="">All Rooms</option>
            {mockRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            <option value="">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
          {(dateFilter || roomFilter || statusFilter || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFilter(''); setRoomFilter(''); setStatusFilter(''); setSearch(''); }}>
              Clear filters
            </Button>
          )}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700 text-xs">{getRoomName(b.roomId)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{getOrgName(b.orgId)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(b.date)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.startTime}–{b.endTime}</td>
                    <td className="px-4 py-3 font-medium text-gray-700 text-xs">{formatCurrency(b.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(b.status) as any}>
                        {b.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {b.status === 'CONFIRMED' && (
                        <Button variant="danger" size="sm" onClick={() => { cancelBooking(b.id); toast('Booking cancelled', 'warning'); }}>
                          <XCircle className="h-3 w-3" />
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

      {/* Create Single Booking Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Booking" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Create a booking on behalf of an organisation.</p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Organisation</label>
            <select value={createForm.orgId} onChange={e => setCreateForm(p => ({ ...p, orgId: e.target.value }))} className={inputClass}>
              {mockOrganisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Room</label>
            <select value={createForm.roomId} onChange={e => setCreateForm(p => ({ ...p, roomId: e.target.value }))} className={inputClass}>
              {mockRooms.map(r => <option key={r.id} value={r.id}>{r.name} — {r.pricePerHour === 0 ? 'Free' : formatCurrency(r.pricePerHour) + '/hr'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input type="date" value={createForm.date} onChange={e => setCreateForm(p => ({ ...p, date: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
              <input type="time" value={createForm.startTime} onChange={e => setCreateForm(p => ({ ...p, startTime: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Time</label>
              <input type="time" value={createForm.endTime} onChange={e => setCreateForm(p => ({ ...p, endTime: e.target.value }))} className={inputClass} />
            </div>
          </div>
          {createForm.startTime < createForm.endTime && (() => {
            const room = mockRooms.find(r => r.id === createForm.roomId);
            if (!room) return null;
            const duration = getDurationHours(createForm.startTime, createForm.endTime);
            const price = room.priceCapHours
              ? Math.min(room.pricePerHour * duration, room.pricePerHour * room.priceCapHours)
              : room.pricePerHour * duration;
            return (
              <div className="bg-blue-50 rounded-md px-3 py-2 text-sm text-blue-700">
                Duration: {duration}h — Total: {formatCurrency(price)}
              </div>
            );
          })()}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
            <Button loading={creating} onClick={handleCreate} className="flex-1">Create Booking</Button>
          </div>
        </div>
      </Modal>

      {/* Create Recurring Booking Modal */}
      <Modal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} title="Create Recurring Booking" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Room</label>
              <select value={recurringForm.roomId} onChange={e => setRecurringForm(p => ({ ...p, roomId: e.target.value }))} className={inputClass}>
                {mockRooms.filter(r => !r.adminManaged).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Organisation</label>
              <select value={recurringForm.orgId} onChange={e => setRecurringForm(p => ({ ...p, orgId: e.target.value }))} className={inputClass}>
                {mockOrganisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input type="date" value={recurringForm.startDate} onChange={e => setRecurringForm(p => ({ ...p, startDate: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
              <input type="time" value={recurringForm.startTime} onChange={e => setRecurringForm(p => ({ ...p, startTime: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Time</label>
              <input type="time" value={recurringForm.endTime} onChange={e => setRecurringForm(p => ({ ...p, endTime: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
              <select value={recurringForm.frequency} onChange={e => setRecurringForm(p => ({ ...p, frequency: e.target.value }))} className={inputClass}>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input type="date" value={recurringForm.endDate} onChange={e => setRecurringForm(p => ({ ...p, endDate: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowRecurringModal(false)} className="flex-1">Cancel</Button>
            <Button loading={creating} onClick={handleCreateRecurring} className="flex-1">Create Recurring Bookings</Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
