'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { CalendarDays, MapPin, Users, CheckCircle, PartyPopper } from 'lucide-react';

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

const mockEvents: RHAEvent[] = [
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
    name: 'Governance Subcommittee Meeting',
    date: '2026-03-28',
    time: '11:00 AM – 12:30 PM',
    location: 'Board Room',
    type: 'Subcommittee',
    description: 'Monthly meeting of the Governance Subcommittee to review policy updates, compliance matters, and committee terms of reference.',
    capacity: 15,
    spotsLeft: 5,
  },
  {
    id: 'evt-4',
    name: 'Community Morning Tea',
    date: '2026-04-10',
    time: '10:00 AM – 11:30 AM',
    location: 'Main Hall',
    type: 'Community',
    description: 'Come along for a relaxed morning tea with fellow Ross House tenants and community members. A great opportunity to meet your neighbours and catch up over coffee.',
    capacity: 60,
    spotsLeft: 38,
  },
  {
    id: 'evt-5',
    name: 'Digital Skills Workshop',
    date: '2026-04-22',
    time: '1:00 PM – 3:00 PM',
    location: 'Training Room 2',
    type: 'Workshop',
    description: 'Hands-on workshop covering digital tools for not-for-profits: cloud collaboration, social media strategy, and cybersecurity basics. Suitable for all skill levels.',
    capacity: 25,
    spotsLeft: 9,
  },
  {
    id: 'evt-6',
    name: 'Building & Facilities Subcommittee',
    date: '2026-04-08',
    time: '3:00 PM – 4:00 PM',
    location: 'Meeting Room 3',
    type: 'Subcommittee',
    description: 'Quarterly subcommittee meeting to review building maintenance priorities, upcoming capital works, and tenant facility requests.',
    capacity: 12,
    spotsLeft: 3,
  },
];

const eventTypeBadge: Record<EventType, { label: string; variant: 'danger' | 'info' | 'warning' | 'success' | 'default' }> = {
  AGM: { label: 'AGM', variant: 'danger' },
  Workshop: { label: 'Workshop', variant: 'info' },
  Subcommittee: { label: 'Subcommittee', variant: 'warning' },
  Community: { label: 'Community', variant: 'success' },
};

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function EventsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my-rsvps'>('upcoming');
  const [rsvpdIds, setRsvpdIds] = useState<Set<string>>(new Set());

  if (!currentUser) return null;

  const rsvpdEvents = mockEvents.filter(e => rsvpdIds.has(e.id));

  const handleRSVP = (event: RHAEvent) => {
    if (rsvpdIds.has(event.id)) return;
    setRsvpdIds(prev => new Set([...prev, event.id]));
    toast(`RSVP confirmed for "${event.name}"`, 'success');
  };

  const handleCancelRSVP = (event: RHAEvent) => {
    setRsvpdIds(prev => {
      const next = new Set(prev);
      next.delete(event.id);
      return next;
    });
    toast(`RSVP cancelled for "${event.name}"`, 'success');
  };

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events &amp; RSVPs</h1>
          <p className="text-gray-500 mt-1">Browse upcoming RHA events and manage your RSVPs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['upcoming', 'my-rsvps'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'upcoming' ? 'Upcoming Events' : (
                <span className="flex items-center gap-1.5">
                  My RSVPs
                  {rsvpdIds.size > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1e3a5f] text-white text-xs">
                      {rsvpdIds.size}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Upcoming Events Tab */}
        {activeTab === 'upcoming' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mockEvents.map(event => {
              const isRsvpd = rsvpdIds.has(event.id);
              const cfg = eventTypeBadge[event.type];
              return (
                <Card key={event.id}>
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base">{event.name}</h3>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{formatEventDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 pl-0.5 font-mono text-xs">⏰</span>
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.spotsLeft > 0
                            ? <span className={event.spotsLeft <= 5 ? 'text-orange-600 font-medium' : ''}>{event.spotsLeft} spot{event.spotsLeft !== 1 ? 's' : ''} left</span>
                            : <span className="text-red-600 font-medium">Fully booked</span>
                          }
                        </span>
                      </div>
                      {isRsvpd ? (
                        <Button
                          size="sm"
                          disabled
                          className="bg-green-600 hover:bg-green-600 text-white opacity-100 cursor-default"
                        >
                          <CheckCircle className="h-4 w-4" /> RSVP&apos;d
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRSVP(event)}
                          disabled={event.spotsLeft === 0}
                        >
                          RSVP
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* My RSVPs Tab */}
        {activeTab === 'my-rsvps' && (
          <div className="space-y-4">
            {rsvpdEvents.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <PartyPopper className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No RSVPs yet</p>
                  <p className="text-gray-400 text-sm mt-1">Browse upcoming events and RSVP to save your spot.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('upcoming')}>
                    View Upcoming Events
                  </Button>
                </CardBody>
              </Card>
            ) : rsvpdEvents.map(event => {
              const cfg = eventTypeBadge[event.type];
              return (
                <Card key={event.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <Badge variant="success">RSVP Confirmed</Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900">{event.name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {formatEventDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelRSVP(event)}
                      >
                        Cancel RSVP
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
