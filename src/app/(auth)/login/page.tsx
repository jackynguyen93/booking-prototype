'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const demoAccounts = [
  { email: 'admin@rosshouse.org.au', password: 'admin123', role: 'ADMIN', name: 'Alex Admin' },
  { email: 'sarah@greenspace.org.au', password: 'pass123', role: 'Member Tenant', name: 'Sarah Mitchell' },
  { email: 'james@techstart.org.au', password: 'pass123', role: 'Member Tenant', name: 'James Chen' },
  { email: 'mike@externalbiz.com', password: 'pass123', role: 'Facility User', name: 'Mike Thompson' },
  { email: 'pending@neworg.org.au', password: 'pass123', role: 'Pending', name: 'Emma Wilson' },
  { email: 'trades@plumbing.com', password: 'pass123', role: 'Trades', name: 'Bob Plumber' },
];

export default function LoginPage() {
  const { login, currentUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = login(email, password);
    setLoading(false);
    if (result.success) {
      const user = JSON.parse(localStorage.getItem('rh_current_user') || '{}');
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleDemoLogin = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a5f] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#1e3a5f] font-bold">RH</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Ross House Association</p>
              <p className="text-blue-300 text-sm">Tenant & Booking Portal</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Melbourne&apos;s Community Hub
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Manage bookings, invoices, maintenance requests, and more — all in one place for the Ross House community.
          </p>
        </div>
        <div className="text-blue-300 text-sm">
          247 Flinders Lane, Melbourne VIC 3000
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                placeholder="you@organisation.org.au"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-[#1e3a5f] hover:underline">
              Forgot password?
            </Link>
            <Link href="/register" className="text-[#1e3a5f] hover:underline">
              Register organisation
            </Link>
          </div>

          {/* Demo Accounts */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Demo Accounts</p>
            <div className="space-y-1">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => handleDemoLogin(acc)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-700">{acc.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({acc.email})</span>
                  </div>
                  <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{acc.role}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-500 mt-2">All passwords: <strong>admin123</strong> or <strong>pass123</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
