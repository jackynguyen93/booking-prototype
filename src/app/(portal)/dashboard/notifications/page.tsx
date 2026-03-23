'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { Bell, Package, FileText, Calendar, Wrench, CheckCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { NotificationType } from '@/types';

const typeIcon = (type: NotificationType) => {
  const icons: Record<string, React.ReactNode> = {
    BOOKING_CONFIRMATION: <Calendar className="h-4 w-4" />,
    PARCEL_ALERT: <Package className="h-4 w-4" />,
    BUILDING_NEWS: <Bell className="h-4 w-4" />,
    INVOICE: <FileText className="h-4 w-4" />,
    MAINTENANCE: <Wrench className="h-4 w-4" />,
    GENERAL: <Bell className="h-4 w-4" />,
  };
  return icons[type] || <Bell className="h-4 w-4" />;
};

const typeVariant = (type: NotificationType) => {
  const variants: Record<string, string> = {
    BOOKING_CONFIRMATION: 'success',
    PARCEL_ALERT: 'warning',
    BUILDING_NEWS: 'info',
    INVOICE: 'danger',
    MAINTENANCE: 'default',
    GENERAL: 'default',
  };
  return variants[type] || 'default';
};

const typeLabel = (type: NotificationType) => {
  const labels: Record<string, string> = {
    BOOKING_CONFIRMATION: 'Booking',
    PARCEL_ALERT: 'Parcel',
    BUILDING_NEWS: 'News',
    INVOICE: 'Invoice',
    MAINTENANCE: 'Maintenance',
    GENERAL: 'General',
  };
  return labels[type] || type;
};

const filterOptions = [
  { value: 'ALL', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'BOOKING_CONFIRMATION', label: 'Bookings' },
  { value: 'PARCEL_ALERT', label: 'Parcels' },
  { value: 'BUILDING_NEWS', label: 'News' },
  { value: 'INVOICE', label: 'Invoices' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [filter, setFilter] = useState('ALL');

  if (!currentUser) return null;

  const myNotifs = notifications
    .filter(n => n.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filtered = myNotifs.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.read;
    return n.type === filter;
  });

  const unreadCount = myNotifs.filter(n => !n.read).length;

  const handleMarkAll = () => {
    markAllNotificationsRead(currentUser.id);
    toast('All notifications marked as read', 'success');
  };

  return (
    <PortalLayout>
      <ToastContainer />
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAll}>
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
              {opt.value === 'UNREAD' && unreadCount > 0 && (
                <span className="ml-1.5 bg-white text-[#1e3a5f] rounded-full px-1.5 py-0.5 text-xs font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <Card>
          {filtered.length === 0 ? (
            <CardBody className="text-center py-10">
              <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No notifications yet</p>
            </CardBody>
          ) : (
            <div>
              {filtered.map((n, i) => (
                <div
                  key={n.id}
                  className={`flex gap-4 px-6 py-4 ${i < filtered.length - 1 ? 'border-b border-gray-100' : ''} ${!n.read ? 'bg-blue-50/50' : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
                  onClick={() => { if (!n.read) markNotificationRead(n.id); }}
                >
                  <div className={`mt-0.5 p-2 rounded-full shrink-0 ${!n.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={typeVariant(n.type) as any} className="text-xs">{typeLabel(n.type)}</Badge>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  );
}
