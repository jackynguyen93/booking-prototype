'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { mockRooms } from '@/data/rooms';
import { mockOrganisations } from '@/data/organisations';
import { format } from 'date-fns';

export default function FoyerScreenPage() {
  const [time, setTime] = useState(new Date());
  const { bookings } = useApp();

  // Clock tick — every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated live refresh — re-reads from context (which reads localStorage) every 30s
  const [, forceRefresh] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceRefresh(n => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const today = format(time, 'yyyy-MM-dd');
  const todayBookings = bookings.filter(b => b.date === today && b.status === 'CONFIRMED');
  const meetingRooms = mockRooms.filter(r => !r.adminManaged && r.type !== 'CAR_PARK' && r.type !== 'PHONE_BOOTH');
  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const currentHour = time.getHours();
  const currentMin = time.getMinutes();
  const currentTimeMin = currentHour * 60 + currentMin;

  const isActive = (startTime: string, endTime: string) => {
    const startMin = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMin = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    return currentTimeMin >= startMin && currentTimeMin < endMin;
  };

  const isUpcoming = (startTime: string) => {
    const startMin = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    return startMin > currentTimeMin && startMin - currentTimeMin <= 60;
  };

  return (
    <div className="min-h-screen bg-[#1e3a5f] text-white p-8 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#1e3a5f] font-bold text-lg">RH</span>
            </div>
            <h1 className="text-4xl font-bold">Ross House Association</h1>
          </div>
          <p className="text-2xl text-blue-200 ml-16">247 Flinders Lane, Melbourne</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold font-mono tabular-nums">{format(time, 'HH:mm')}</p>
          <p className="text-xl text-blue-200 mt-1">{format(time, 'EEEE d MMMM yyyy')}</p>
        </div>
      </div>

      {/* Room columns */}
      <div className="flex-1 grid gap-6" style={{ gridTemplateColumns: `repeat(${meetingRooms.length}, 1fr)` }}>
        {meetingRooms.map(room => {
          const roomBookings = todayBookings
            .filter(b => b.roomId === room.id)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={room.id} className="flex flex-col">
              <div className="bg-white/10 rounded-t-2xl px-5 py-4 mb-3">
                <h2 className="text-2xl font-bold">{room.name}</h2>
                <p className="text-blue-300">{room.floor} · {room.capacity} seats</p>
              </div>

              <div className="flex-1 space-y-3">
                {roomBookings.length === 0 ? (
                  <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-5 py-6 text-center">
                    <p className="text-3xl font-bold text-green-300">Available</p>
                    <p className="text-green-400 mt-1">No bookings today</p>
                  </div>
                ) : roomBookings.map(b => {
                  const active = isActive(b.startTime, b.endTime);
                  const upcoming = !active && isUpcoming(b.startTime);
                  return (
                    <div
                      key={b.id}
                      className={`rounded-xl px-5 py-4 border-2 ${
                        active
                          ? 'bg-red-500/20 border-red-400/50'
                          : upcoming
                          ? 'bg-yellow-500/20 border-yellow-400/50'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                          active ? 'bg-red-500 text-white' :
                          upcoming ? 'bg-yellow-500 text-black' :
                          'bg-white/20 text-white'
                        }`}>
                          {active ? 'IN USE' : upcoming ? 'STARTING SOON' : 'UPCOMING'}
                        </span>
                      </div>
                      <p className="text-3xl font-bold font-mono mt-2">{b.startTime} – {b.endTime}</p>
                      <p className="text-xl text-blue-200 mt-1">{getOrgName(b.orgId)}</p>
                    </div>
                  );
                })}

                {/* Check if room is currently available between bookings */}
                {roomBookings.length > 0 && !roomBookings.some(b => isActive(b.startTime, b.endTime)) && (
                  <div className="bg-green-500/10 border border-green-400/20 rounded-xl px-5 py-3 text-center">
                    <p className="text-xl font-semibold text-green-300">Currently Available</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-blue-300 text-sm">
        <p>Ross House Association · 247 Flinders Lane Melbourne VIC 3000 · (03) 9650 5935</p>
        <p>Book at rosshouse.org.au</p>
      </div>
    </div>
  );
}
