'use client';

import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockRooms } from '@/data/rooms';
import { mockInvoices } from '@/data/invoices';
import { mockOrganisations } from '@/data/organisations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, DollarSign, Clock, AlertCircle, Plus, Bell, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const TODAY = '2026-03-20';

const statusBadgeVariant = (status: string) => {
  if (status === 'CONFIRMED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  if (status === 'COMPLETED') return 'default';
  return 'info';
};

export default function DashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const { bookings, notifications, users } = useApp();

  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.userId === currentUser.id && b.status !== 'CANCELLED');
  const upcomingBookings = myBookings.filter(b => b.date >= TODAY && b.status === 'CONFIRMED').sort((a, b) => a.date.localeCompare(b.date));
  const unreadNotifs = notifications.filter(n => n.userId === currentUser.id && !n.read);
  const myInvoices = mockInvoices.filter(i => i.orgId === currentUser.orgId);
  const pendingInvoices = myInvoices.filter(i => i.status !== 'PAID');
  const latestInvoice = myInvoices[0];

  // Admin stats
  const todayBookings = bookings.filter(b => b.date === TODAY && b.status === 'CONFIRMED');
  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const allPendingInvoices = mockInvoices.filter(i => i.status !== 'PAID');
  const monthRevenue = bookings
    .filter(b => b.date.startsWith('2026-03') && b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const getRoomName = (roomId: string) => mockRooms.find(r => r.id === roomId)?.name || roomId;
  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  if (isAdmin()) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Ross House Association — overview and quick actions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard title="Bookings Today" value={todayBookings.length} icon={<Calendar className="h-8 w-8" />} accentColor="border-blue-500" />
            <StatsCard title="Revenue This Month" value={formatCurrency(monthRevenue)} icon={<DollarSign className="h-8 w-8" />} accentColor="border-green-500" />
            <StatsCard title="Pending Approvals" value={pendingUsers.length} icon={<Clock className="h-8 w-8" />} accentColor="border-yellow-500" />
            <StatsCard title="Outstanding Invoices" value={allPendingInvoices.length} icon={<AlertCircle className="h-8 w-8" />} accentColor="border-red-500" />
          </div>

          {/* Revenue bar chart */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Revenue by Room (March 2026)</h2>
            </CardHeader>
            <CardBody>
              {mockRooms.filter(r => !r.adminManaged).map(room => {
                const rev = bookings.filter(b => b.roomId === room.id && b.date.startsWith('2026-03') && b.status !== 'CANCELLED').reduce((s, b) => s + b.totalPrice, 0);
                const maxRev = 800;
                return (
                  <div key={room.id} className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{room.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-[#1e3a5f] rounded-full transition-all"
                        style={{ width: `${Math.max(2, (rev / maxRev) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">{formatCurrency(rev)}</span>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent bookings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Today&apos;s Bookings</h2>
                  <Link href="/admin/bookings"><Button variant="ghost" size="sm">View All</Button></Link>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Room</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Org</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayBookings.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-4 text-gray-400 text-center">No bookings today</td></tr>
                    ) : todayBookings.map(b => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-700">{getRoomName(b.roomId)}</td>
                        <td className="px-6 py-3 text-gray-500">{getOrgName(b.orgId)}</td>
                        <td className="px-6 py-3 text-gray-500">{b.startTime}–{b.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pending approvals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
                  <Link href="/admin/users"><Button variant="ghost" size="sm">View All</Button></Link>
                </div>
              </CardHeader>
              <CardBody>
                {pendingUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No pending approvals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-700 text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name.split(' ')[0]}</h1>
            <p className="text-gray-500">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
          </div>
          <Link href="/dashboard/rooms">
            <Button size="lg">
              <Plus className="h-4 w-4" />
              Book a Room
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Upcoming Bookings" value={upcomingBookings.length} icon={<Calendar className="h-7 w-7" />} />
          <StatsCard title="Unread Notifications" value={unreadNotifs.length} icon={<Bell className="h-7 w-7" />} accentColor="border-yellow-400" />
          <StatsCard title="Outstanding Invoices" value={pendingInvoices.length} icon={<AlertCircle className="h-7 w-7" />} accentColor={pendingInvoices.length > 0 ? 'border-red-500' : 'border-green-500'} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Upcoming Bookings</h2>
                <Link href="/dashboard/bookings"><Button variant="ghost" size="sm">View All</Button></Link>
              </div>
            </CardHeader>
            <CardBody>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-3">No upcoming bookings</p>
                  <Link href="/dashboard/rooms"><Button variant="outline" size="sm">Book a Room</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 4).map(b => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-700 text-sm">{getRoomName(b.roomId)}</p>
                        <p className="text-xs text-gray-400">{formatDate(b.date)} · {b.startTime}–{b.endTime}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusBadgeVariant(b.status) as any}>{b.status}</Badge>
                        <p className="text-xs text-gray-400 mt-1">{formatCurrency(b.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Bell className="h-4 w-4" /> Recent Notifications</h2>
                <Link href="/dashboard/notifications"><Button variant="ghost" size="sm">View All</Button></Link>
              </div>
            </CardHeader>
            <CardBody>
              {unreadNotifs.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No unread notifications</p>
              ) : (
                <div className="space-y-3">
                  {unreadNotifs.slice(0, 4).map(n => (
                    <div key={n.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.body.substring(0, 80)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Latest invoice */}
        {latestInvoice && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Latest Invoice</h2>
                <Link href="/dashboard/invoices"><Button variant="ghost" size="sm">View All Invoices</Button></Link>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">{latestInvoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">{latestInvoice.period} · Due {formatDate(latestInvoice.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(latestInvoice.amount)}</p>
                  <Badge variant={latestInvoice.status === 'PAID' ? 'success' : latestInvoice.status === 'OVERDUE' ? 'danger' : 'warning'}>
                    {latestInvoice.status}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
