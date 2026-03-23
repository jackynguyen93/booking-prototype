'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { mockRooms } from '@/data/rooms';
import { mockOrganisations } from '@/data/organisations';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, Download, TrendingUp, Clock, DollarSign, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

type DateRange = 'this-month' | 'last-3-months' | 'this-year';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Mock monthly booking trend data (last 12 months ending March 2026)
const MONTHLY_TREND = [
  { month: 'Apr', count: 28 },
  { month: 'May', count: 32 },
  { month: 'Jun', count: 25 },
  { month: 'Jul', count: 18 },
  { month: 'Aug', count: 22 },
  { month: 'Sep', count: 35 },
  { month: 'Oct', count: 41 },
  { month: 'Nov', count: 38 },
  { month: 'Dec', count: 20 },
  { month: 'Jan', count: 30 },
  { month: 'Feb', count: 36 },
  { month: 'Mar', count: 42 },
];

// Mock top organisations data
const TOP_ORGS = [
  { name: 'Green Space Initiative', bookingCount: 18, totalSpend: 1620 },
  { name: 'Community Health Hub', bookingCount: 14, totalSpend: 1260 },
  { name: 'Youth Advocacy Network', bookingCount: 11, totalSpend: 990 },
  { name: 'Cultural Exchange Society', bookingCount: 9, totalSpend: 810 },
  { name: 'Social Enterprise Hub', bookingCount: 7, totalSpend: 630 },
];

// Mock user type breakdown
const USER_TYPE_DATA = [
  { label: 'Tenant', count: 45, color: 'bg-[#1e3a5f]' },
  { label: 'Member', count: 32, color: 'bg-blue-400' },
  { label: 'Facility User', count: 18, color: 'bg-blue-300' },
  { label: 'Admin', count: 5, color: 'bg-blue-200' },
];

function getDateRangeFilter(range: DateRange): (date: string) => boolean {
  const now = new Date();
  if (range === 'this-month') {
    const prefix = format(now, 'yyyy-MM');
    return (d: string) => d.startsWith(prefix);
  }
  if (range === 'last-3-months') {
    const cutoff = format(subMonths(now, 3), 'yyyy-MM');
    return (d: string) => d >= cutoff;
  }
  // this-year
  const year = format(now, 'yyyy');
  return (d: string) => d.startsWith(year);
}

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const { bookings } = useApp();
  const [dateRange, setDateRange] = useState<DateRange>('this-month');

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  const inRange = getDateRangeFilter(dateRange);
  const rangeBookings = bookings.filter(b => inRange(b.date) && b.status !== 'CANCELLED');

  // Stat cards
  const totalBookings = rangeBookings.length;
  const totalRevenue = rangeBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Avg duration in hours
  const avgDurationHours = rangeBookings.length === 0 ? 0 : (() => {
    const totalMinutes = rangeBookings.reduce((sum, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);
    return (totalMinutes / rangeBookings.length / 60).toFixed(1);
  })();

  // Most popular room
  const roomBookingCounts = mockRooms
    .filter(r => !r.adminManaged)
    .map(room => ({
      room,
      count: rangeBookings.filter(b => b.roomId === room.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const mostPopularRoom = roomBookingCounts[0]?.room.name || 'N/A';

  // Revenue by room
  const revenueByRoom = mockRooms
    .filter(r => !r.adminManaged)
    .map(room => ({
      room,
      revenue: rangeBookings.filter(b => b.roomId === room.id).reduce((s, b) => s + b.totalPrice, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
  const maxRoomRevenue = Math.max(...revenueByRoom.map(r => r.revenue), 1);

  // User type chart
  const totalUserTypeCount = USER_TYPE_DATA.reduce((sum, r) => sum + r.count, 0);
  const maxUserTypeCount = Math.max(...USER_TYPE_DATA.map(r => r.count), 1);

  // Monthly trend
  const maxMonthlyCount = Math.max(...MONTHLY_TREND.map(m => m.count), 1);

  const rangeLabel = {
    'this-month': format(new Date(), 'MMMM yyyy'),
    'last-3-months': 'Last 3 Months',
    'this-year': `Year ${format(new Date(), 'yyyy')}`,
  }[dateRange];

  return (
    <PortalLayout requireAdmin>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
            <p className="text-gray-500">Booking trends, revenue analysis, and usage insights</p>
          </div>
          <Button variant="outline" onClick={() => toast('Generating report...', 'info')}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Date range selector */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
              {([
                { value: 'this-month', label: 'This Month' },
                { value: 'last-3-months', label: 'Last 3 Months' },
                { value: 'this-year', label: 'This Year' },
              ] as { value: DateRange; label: string }[]).map(option => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    value={option.value}
                    checked={dateRange === option.value}
                    onChange={() => setDateRange(option.value)}
                    className="text-[#1e3a5f] focus:ring-[#1e3a5f]"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
              <span className="ml-auto text-sm text-gray-400 font-medium">{rangeLabel}</span>
            </div>
          </CardBody>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">{avgDurationHours}h</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Most Popular</p>
                <p className="text-base font-bold text-gray-900 leading-tight">{mostPopularRoom}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue by room */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Revenue by Room — {rangeLabel}</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {revenueByRoom.map(({ room, revenue }) => (
                <div key={room.id} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{room.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-[#1e3a5f] rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${Math.max(3, (revenue / maxRoomRevenue) * 100)}%` }}
                    >
                      {revenue > 50 && (
                        <span className="text-white text-xs font-medium">{formatCurrency(revenue)}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-20 text-right">{formatCurrency(revenue)}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Bookings by user type */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Bookings by User Type</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {USER_TYPE_DATA.map(row => (
                <div key={row.label} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-28 shrink-0">{row.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full flex items-center justify-end pr-2 transition-all`}
                      style={{ width: `${Math.max(4, (row.count / maxUserTypeCount) * 100)}%` }}
                    >
                      <span className="text-white text-xs font-medium">{row.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {Math.round((row.count / totalUserTypeCount) * 100)}%
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Monthly booking trend */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Monthly Booking Trend (Last 12 Months)</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-end gap-2 h-40">
              {MONTHLY_TREND.map(({ month, count }) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{count}</span>
                  <div
                    className="w-full bg-[#1e3a5f] rounded-t transition-all hover:bg-[#16304f]"
                    style={{ height: `${Math.max(4, (count / maxMonthlyCount) * 100)}%` }}
                    title={`${month}: ${count} bookings`}
                  />
                  <span className="text-xs text-gray-400">{month}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Top organisations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Top Organisations by Revenue</h2>
              <span className="text-xs text-gray-400">Mock data shown</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Spend</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Share</th>
                </tr>
              </thead>
              <tbody>
                {TOP_ORGS.map((org, idx) => {
                  const totalSpend = TOP_ORGS.reduce((s, o) => s + o.totalSpend, 0);
                  const share = Math.round((org.totalSpend / totalSpend) * 100);
                  return (
                    <tr key={org.name} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-400 text-sm font-medium">{idx + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{org.name}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{org.bookingCount}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{formatCurrency(org.totalSpend)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
                            <div
                              className="h-full bg-[#1e3a5f] rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
