'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { mockRooms } from '@/data/rooms';
import { formatCurrency } from '@/lib/utils';
import { Room, RoomType } from '@/types';
import { Monitor, ToggleLeft, ToggleRight } from 'lucide-react';

const ROOM_TYPE_COLORS: Record<RoomType, string> = {
  BOARD_ROOM: 'bg-blue-100 text-blue-800',
  TRAINING_ROOM: 'bg-green-100 text-green-800',
  MEETING_ROOM: 'bg-purple-100 text-purple-800',
  PHONE_BOOTH: 'bg-teal-100 text-teal-800',
  CAR_PARK: 'bg-gray-100 text-gray-800',
};

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  BOARD_ROOM: 'Board Room',
  TRAINING_ROOM: 'Training Room',
  MEETING_ROOM: 'Meeting Room',
  PHONE_BOOTH: 'Phone Booth',
  CAR_PARK: 'Car Park',
};

export default function AdminRoomsPage() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState(mockRooms.map(r => ({ ...r, available: true })));
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<Partial<Room>>({});
  const [saving, setSaving] = useState(false);

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm(room);
  };

  const handleSave = async () => {
    if (!editingRoom) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...form } : r));
    setSaving(false);
    setEditingRoom(null);
    toast('Room updated successfully', 'success');
  };

  const toggleAvailability = (roomId: string, roomName: string) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, available: !r.available } : r));
    const room = rooms.find(r => r.id === roomId);
    const next = !room?.available;
    toast(`${roomName} marked as ${next ? 'available' : 'unavailable'}`, next ? 'success' : 'warning');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500">{rooms.length} rooms configured</p>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price/hr</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">AV?</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Floor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tenants Only</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Admin Managed</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Availability</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!room.available ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${room.colorClass}`} />
                        <span className="font-medium text-gray-900">{room.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROOM_TYPE_COLORS[room.type]}`}>
                        {ROOM_TYPE_LABELS[room.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{room.capacity}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {room.pricePerHour === 0 ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        formatCurrency(room.pricePerHour)
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {room.hasAV ? (
                        <Badge variant="info"><Monitor className="h-3 w-3 mr-1 inline" />Yes</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{room.floor}</td>
                    <td className="px-6 py-4">
                      {room.tenantsOnly ? (
                        <Badge variant="warning">Yes</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {room.adminManaged ? (
                        <Badge variant="danger">Yes</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAvailability(room.id, room.name)}
                        className="flex items-center gap-1.5 text-sm"
                        title={room.available ? 'Mark unavailable' : 'Mark available'}
                      >
                        {room.available ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-green-500" />
                            <span className="text-green-600 text-xs font-medium">Available</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-400 text-xs font-medium">Unavailable</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => openEdit(room)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!editingRoom} onClose={() => setEditingRoom(null)} title={`Edit: ${editingRoom?.name}`} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Room Name</label>
            <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Capacity</label>
              <input type="number" value={form.capacity || 0} onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price Per Hour (AUD)</label>
              <input type="number" value={form.pricePerHour || 0} onChange={e => setForm(p => ({ ...p, pricePerHour: parseFloat(e.target.value) }))} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Floor</label>
              <input type="text" value={form.floor || ''} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price Cap (hours)</label>
              <input type="number" value={form.priceCapHours || ''} onChange={e => setForm(p => ({ ...p, priceCapHours: e.target.value ? parseInt(e.target.value) : undefined }))} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.hasAV || false} onChange={e => setForm(p => ({ ...p, hasAV: e.target.checked }))} className="h-4 w-4 rounded" />
              Has AV equipment
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.tenantsOnly || false} onChange={e => setForm(p => ({ ...p, tenantsOnly: e.target.checked }))} className="h-4 w-4 rounded" />
              Tenants only
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.adminManaged || false} onChange={e => setForm(p => ({ ...p, adminManaged: e.target.checked }))} className="h-4 w-4 rounded" />
              Admin managed
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditingRoom(null)} className="flex-1">Cancel</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">Save Changes</Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
