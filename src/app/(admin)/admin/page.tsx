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
import { Calendar, DollarSign, Clock, AlertCircle, Users, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { format } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const CURRENT_MONTH = format(new Date(), 'yyyy-MM');

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const { bookings, users, approveUser, rejectUser } = useApp();

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const todayBookings = bookings.filter(b => b.date === TODAY && b.status === 'CONFIRMED');
  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const allInvoices = mockInvoices;
  const outstandingInvoices = allInvoices.filter(i => i.status !== 'PAID');
  const monthRevenue = bookings
    .filter(b => b.date.startsWith(CURRENT_MONTH) && b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const getRoomName = (roomId: string) => mockRooms.find(r => r.id === roomId)?.name || roomId;
  const getOrgName = (orgId: string) => mockOrganisations.find(o => o.id === orgId)?.name || orgId;

  const revenueByRoom = mockRooms.filter(r => !r.adminManaged).map(room => ({
    room,
    revenue: bookings.filter(b => b.roomId === room.id && b.date.startsWith(CURRENT_MONTH) && b.status !== 'CANCELLED')
      .reduce((s, b) => s + b.totalPrice, 0),
  })).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...revenueByRoom.map(r => r.revenue), 1);

  const handleApprove = (id: string, name: string) => {
    approveUser(id);
    toast(`${name} approved successfully`, 'success');
  };

  const handleReject = (id: string, name: string) => {
    rejectUser(id);
    toast(`${name} registration rejected`, 'warning');
  };

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Ross House Association — System Overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard title="Bookings Today" value={todayBookings.length} icon={<Calendar className="h-8 w-8" />} accentColor="border-blue-500" />
          <StatsCard title="Revenue This Month" value={formatCurrency(monthRevenue)} icon={<DollarSign className="h-8 w-8" />} accentColor="border-green-500" />
          <StatsCard title="Pending Approvals" value={pendingUsers.length} icon={<Clock className="h-8 w-8" />} accentColor="border-yellow-500" />
          <StatsCard title="Outstanding Invoices" value={outstandingInvoices.length} icon={<AlertCircle className="h-8 w-8" />} accentColor="border-red-500" />
        </div>

        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Room Revenue — {format(new Date(), 'MMMM yyyy')}</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {revenueByRoom.map(({ room, revenue }) => (
              <div key={room.id} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{room.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-[#1e3a5f] rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max(3, (revenue / maxRevenue) * 100)}%` }}
                  >
                    {revenue > 50 && <span className="text-white text-xs font-medium">{formatCurrency(revenue)}</span>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 w-20 text-right">{formatCurrency(revenue)}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's bookings */}
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
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Room</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Organisation</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Time</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {todayBookings.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No bookings today</td></tr>
                  ) : todayBookings.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-700 text-xs">{getRoomName(b.roomId)}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs truncate max-w-[120px]">{getOrgName(b.orgId)}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{b.startTime}–{b.endTime}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs font-medium">{formatCurrency(b.totalPrice)}</td>
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
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-700 text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        <p className="text-xs text-gray-400">{getOrgName(u.orgId)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleReject(u.id, u.name)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(u.id, u.name)}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      </div>
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
