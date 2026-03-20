'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockRooms } from '@/data/rooms';
import { canAccessRoom } from '@/lib/businessRules';
import { formatCurrency } from '@/lib/utils';
import { Users, Monitor, DollarSign, MapPin, Search } from 'lucide-react';
import Link from 'next/link';

export default function RoomsPage() {
  const { currentUser } = useAuth();
  const { bookings } = useApp();
  const [capacityFilter, setCapacityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  if (!currentUser) return null;

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
    return bookings.filter(b => b.roomId === roomId && b.status === 'CONFIRMED' && b.date >= '2026-03-20').length;
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book a Room</h1>
          <p className="text-gray-500">Browse and book available rooms at Ross House</p>
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
                onChange={e => setDateFilter(e.target.value)}
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
        </div>

        {/* Room Grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Room color banner */}
              <div className={`h-32 ${room.colorClass} flex items-center justify-center relative`}>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600 opacity-50">{room.capacity > 1 ? room.capacity : ''}</p>
                  {room.capacity > 1 && <p className="text-xs text-gray-500 opacity-70">capacity</p>}
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  {room.hasAV && <Badge variant="info">AV</Badge>}
                  {room.tenantsOnly && <Badge variant="warning">Tenants</Badge>}
                  {room.pricePerHour === 0 && <Badge variant="success">Free</Badge>}
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
                  <Link href={`/dashboard/rooms/${room.id}/book${dateFilter ? `?date=${dateFilter}` : ''}`}>
                    <Button>Book Now</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No rooms match your search criteria.</p>
            <Button variant="ghost" onClick={() => { setSearch(''); setCapacityFilter(''); setDateFilter(''); }} className="mt-2">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
