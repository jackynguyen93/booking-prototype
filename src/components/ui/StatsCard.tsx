'use client';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
  accentColor?: string;
}

export function StatsCard({ title, value, icon, trend, className, accentColor = 'border-[#1e3a5f]' }: StatsCardProps) {
  return (
    <div className={cn(`bg-white rounded-lg border border-gray-200 shadow-sm p-6 border-l-4 ${accentColor}`, className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={cn('mt-1 text-sm', trend.positive ? 'text-green-600' : 'text-red-600')}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
