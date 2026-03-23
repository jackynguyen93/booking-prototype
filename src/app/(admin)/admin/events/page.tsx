'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { generateId } from '@/lib/utils';
import { CalendarDays, MapPin, Users, Plus, Pencil, Trash2, UserCheck } from 'lucide-react';

type EventType = 'AGM' | 'Workshop' | 'Subcommittee' | 'Community';

interface RHAEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: EventType;
  description: string;
  capacity: number;
  spotsLeft: number;
}

const typeVariant: Record<EventType, 'danger' | 'info' | 'warning' | 'success'> = {
  AGM: 'danger',
  Workshop: 'info',
  Subcommittee: 'warning',
  Community: 'success',
};

const INITIAL_EVENTS: RHAEvent[] = [
  {
    id: 'evt-1',
    name: 'AGM 2026',
    date: '2026-04-15',
    time: '10:00 AM – 12:00 PM',
    location: 'Main Hall',
    type: 'AGM',
    description: 'Annual General Meeting of the Ross House Association. All tenants and members are encouraged to attend. Includes financial report, election of committee, and special resolutions.',
    capacity: 80,
    spotsLeft: 24,
  },
  {
    id: 'evt-2',
    name: 'Sustainability Workshop',
    date: '2026-04-03',
    time: '2:00 PM – 4:00 PM',
    location: 'Training Room 1',
    type: 'Workshop',
    description: 'Practical workshop on sustainable practices for not-for-profit organisations. Topics include waste reduction, energy efficiency, and green procurement strategies.',
    capacity: 30,
    spotsLeft: 12,
  },
  {
    id: 'evt-3',
    name: 'Finance & Governance Subcommittee',
    date: '2026-04-08',
    time: '12:00 PM – 1:00 PM',
    location: 'Board Room',
    type: 'Subcommittee',
    description: 'Regular meeting of the Finance and Governance Subcommittee. Review of Q1 financials and policy updates.',
    capacity: 12,
    spotsLeft: 3,
  },
  {
    id: 'evt-4',
    name: 'Tenant Social Morning',
    date: '2026-04-24',
    time: '9:30 AM – 11:00 AM',
    location: 'Level 3 Common Area',
    type: 'Community',
    description: 'Monthly social morning for all Ross House tenants. A chance to connect with neighbours, share news, and enjoy a complimentary breakfast spread.',
    capacity: 60,
    spotsLeft: 41,
  },
];

const EMPTY_FORM = {
  name: '',
  date: '',
  time: '',
  location: '',
  type: 'Community' as EventType,
  description: '',
  capacity: 30,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AdminEventsPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<RHAEvent[]>(INITIAL_EVENTS);
  const [typeFilter, setTypeFilter] = useState<'ALL' | EventType>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewAttendees, setViewAttendees] = useState<RHAEvent | null>(null);

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const filtered = typeFilter === 'ALL' ? events : events.filter(e => e.type === typeFilter);
  const upcoming = events.filter(e => e.date >= new Date().toISOString().split('T')[0]).length;

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (ev: RHAEvent) => {
    setEditId(ev.id);
    setForm({
      name: ev.name,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      type: ev.type,
      description: ev.description,
      capacity: ev.capacity,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.date || !form.time || !form.location) return;
    if (editId) {
      setEvents(prev => prev.map(e => e.id === editId
        ? { ...e, ...form }
        : e
      ));
      toast('Event updated', 'success');
    } else {
      const newEvent: RHAEvent = {
        id: generateId(),
        ...form,
        spotsLeft: form.capacity,
      };
      setEvents(prev => [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date)));
      toast('Event created', 'success');
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
    toast('Event cancelled and removed', 'success');
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]";

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-500">
              {upcoming} upcoming event{upcoming !== 1 ? 's' : ''} · manage RHA events and registrations
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Event
          </Button>
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'AGM', 'Workshop', 'Subcommittee', 'Community'] as const).map(t => (
            <Button
              key={t}
              variant={typeFilter === t ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTypeFilter(t)}
            >
              {t}
              {t !== 'ALL' && (
                <span className="ml-1 text-xs opacity-70">
                  ({events.filter(e => e.type === t).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Events grid */}
        {filtered.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <CalendarDays className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No events found</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>Create First Event</Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(ev => {
              const rsvpd = ev.capacity - ev.spotsLeft;
              const pct = Math.round((rsvpd / ev.capacity) * 100);
              return (
                <Card key={ev.id}>
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={typeVariant[ev.type]}>{ev.type}</Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900">{ev.name}</h3>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(ev)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(ev.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{ev.description}</p>

                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDate(ev.date)} · {ev.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span>{rsvpd} / {ev.capacity} registered</span>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-green-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{ev.spotsLeft} spot{ev.spotsLeft !== 1 ? 's' : ''} remaining</p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setViewAttendees(ev)}
                    >
                      <UserCheck className="h-3.5 w-3.5" /> View Attendees
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Event' : 'Create Event'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="e.g. Tenant Networking Morning" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
              <input type="text" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className={inputClass} placeholder="e.g. 10:00 AM – 12:00 PM" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
              <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className={inputClass} placeholder="e.g. Board Room" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as EventType }))} className={inputClass}>
                <option value="AGM">AGM</option>
                <option value="Workshop">Workshop</option>
                <option value="Subcommittee">Subcommittee</option>
                <option value="Community">Community</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} className={inputClass} min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className={inputClass} placeholder="Describe the event..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.date || !form.time || !form.location} className="flex-1">
              {editId ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Cancel Event" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel and remove this event? Registered attendees will need to be notified separately.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Keep Event</Button>
            <Button onClick={() => handleDelete(confirmDelete!)} className="flex-1 bg-red-600 hover:bg-red-700 border-red-600">
              Cancel Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* Attendees mock modal */}
      <Modal isOpen={!!viewAttendees} onClose={() => setViewAttendees(null)} title="Attendees" size="md">
        {viewAttendees && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900">{viewAttendees.name}</p>
              <p className="text-xs text-gray-500">{viewAttendees.capacity - viewAttendees.spotsLeft} registered · {viewAttendees.spotsLeft} spots remaining</p>
            </div>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {Array.from({ length: viewAttendees.capacity - viewAttendees.spotsLeft }, (_, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <span className="text-gray-800">Attendee {i + 1}</span>
                  <Badge variant="success">Registered</Badge>
                </div>
              ))}
              {viewAttendees.capacity - viewAttendees.spotsLeft === 0 && (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">No registrations yet</div>
              )}
            </div>
            <p className="text-xs text-gray-400">Full attendee list available once registration system is integrated.</p>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
