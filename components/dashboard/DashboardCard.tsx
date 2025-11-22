/**
 * Dashboard Card - Glassmorphic Card Component
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-cyan-500/20 backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-900/30 p-6',
        'hover:border-cyan-500/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10',
        className
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-cyan-300/80">{title}</h3>
          {Icon && (
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Icon className="h-5 w-5 text-cyan-400" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold text-cyan-100">{value}</p>

          {description && (
            <p className="text-sm text-cyan-300/60">{description}</p>
          )}

          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-cyan-300/60">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
