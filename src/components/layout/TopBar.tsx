'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export function TopBar() {
  const { currentUser, logout, isImpersonating, exitImpersonation } = useAuth();
  const { notifications } = useApp();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    MEMBER_TENANT: 'Member Tenant',
    COMMERCIAL_TENANT: 'Commercial Tenant',
    FACILITY_USER: 'Facility User',
    TRADES: 'Trades',
    COMMUNITY_MEMBER: 'Community Member',
  };

  return (
    <>
      {isImpersonating && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
          <span>Impersonating <strong>{currentUser.name}</strong> ({currentUser.email})</span>
          <button
            onClick={() => { exitImpersonation(); router.push('/admin/users'); }}
            className="underline font-semibold hover:text-amber-100"
          >
            Exit Impersonation
          </button>
        </div>
      )}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link href="/dashboard/notifications" className="relative text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{currentUser.avatarInitials || currentUser.name.substring(0, 2).toUpperCase()}</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{roleLabels[currentUser.role] || currentUser.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
