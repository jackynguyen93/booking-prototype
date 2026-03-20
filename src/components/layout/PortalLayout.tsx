'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '@/components/ui/Toast';

export function PortalLayout({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      if (requireAdmin && currentUser.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
    }
  }, [currentUser, isLoading, requireAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;
  if (requireAdmin && currentUser.role !== 'ADMIN') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
