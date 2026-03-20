'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Calendar, BookOpen, User, Bell, FileText,
  Receipt, Wrench, Key, MessageSquare, Award, PartyPopper,
  Users, Building2, CalendarCheck, DoorOpen, FileCheck,
  Package, Monitor, ChevronDown, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const portalNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Book a Room', href: '/dashboard/rooms', icon: <Calendar className="h-4 w-4" /> },
  { label: 'My Bookings', href: '/dashboard/bookings', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Notifications', href: '/dashboard/notifications', icon: <Bell className="h-4 w-4" /> },
  { label: 'Documents', href: '/dashboard/documents', icon: <FileText className="h-4 w-4" /> },
  { label: 'Profile', href: '/dashboard/profile', icon: <User className="h-4 w-4" /> },
];

const tenantNavItems: NavItem[] = [
  { label: 'Invoices', href: '/dashboard/invoices', icon: <Receipt className="h-4 w-4" />, roles: ['MEMBER_TENANT', 'COMMERCIAL_TENANT'] },
  { label: 'Maintenance', href: '/dashboard/maintenance', icon: <Wrench className="h-4 w-4" />, roles: ['MEMBER_TENANT', 'COMMERCIAL_TENANT'] },
  { label: 'Keys & Access', href: '/dashboard/keys', icon: <Key className="h-4 w-4" />, roles: ['MEMBER_TENANT', 'COMMERCIAL_TENANT'] },
  { label: 'Noticeboard', href: '/dashboard/noticeboard', icon: <MessageSquare className="h-4 w-4" />, roles: ['MEMBER_TENANT', 'COMMERCIAL_TENANT'] },
  { label: 'Grants', href: '/dashboard/grants', icon: <Award className="h-4 w-4" />, roles: ['MEMBER_TENANT'] },
  { label: 'Community Events', href: '/dashboard/noticeboard', icon: <PartyPopper className="h-4 w-4" />, roles: ['MEMBER_TENANT', 'COMMERCIAL_TENANT'] },
];

const adminNavItems: NavItem[] = [
  { label: 'Admin Dashboard', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { label: 'Organisations', href: '/admin/organisations', icon: <Building2 className="h-4 w-4" /> },
  { label: 'All Bookings', href: '/admin/bookings', icon: <CalendarCheck className="h-4 w-4" /> },
  { label: 'Rooms', href: '/admin/rooms', icon: <DoorOpen className="h-4 w-4" /> },
  { label: 'Invoices', href: '/admin/invoices', icon: <FileCheck className="h-4 w-4" /> },
  { label: 'Maintenance Queue', href: '/admin/maintenance', icon: <Wrench className="h-4 w-4" /> },
  { label: 'Parcel Alerts', href: '/admin/parcels', icon: <Package className="h-4 w-4" /> },
  { label: 'Foyer Screen', href: '/admin/foyer-screen', icon: <Monitor className="h-4 w-4" /> },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-[#1e3a5f] text-white'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [adminExpanded, setAdminExpanded] = useState(true);

  if (!currentUser) return null;

  const role = currentUser.role;
  const visibleTenantItems = tenantNavItems.filter(item =>
    !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="w-64 min-h-screen bg-gray-100 border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-200 bg-[#1e3a5f]">
        <Link href={role === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-[#1e3a5f] font-bold text-sm">RH</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Ross House</p>
            <p className="text-blue-200 text-xs">Association</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Portal Nav */}
        <div className="mb-2">
          <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Portal</p>
          {portalNavItems.map(item => (
            <NavLink key={item.href + item.label} item={item} pathname={pathname} />
          ))}
        </div>

        {/* Tenant Nav */}
        {visibleTenantItems.length > 0 && (
          <div className="mb-2 pt-2 border-t border-gray-200">
            <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tenant Services</p>
            {visibleTenantItems.map(item => (
              <NavLink key={item.href + item.label} item={item} pathname={pathname} />
            ))}
          </div>
        )}

        {/* Admin Nav */}
        {role === 'ADMIN' && (
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className="flex items-center justify-between w-full px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              <span>Administration</span>
              {adminExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {adminExpanded && adminNavItems.map(item => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      {/* Version */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">Ross House Portal v1.0</p>
      </div>
    </aside>
  );
}
