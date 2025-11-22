/**
 * Dashboard Sidebar - Glassmorphic Navigation
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  FolderKanban,
  Database,
  Settings,
  LogOut,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  user: User;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Corpus', href: '/dashboard/corpus', icon: Database },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-cyan-500/20 backdrop-blur-xl bg-slate-900/50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-cyan-500/20">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            CJ Hirashi
          </h1>
          <p className="text-sm text-cyan-300/60 mt-1">AI Assistant Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  'hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent',
                  isActive &&
                    'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-cyan-400' : 'text-cyan-300/60'
                  )}
                />
                <span
                  className={cn(
                    'font-medium',
                    isActive ? 'text-cyan-100' : 'text-cyan-300/80'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-cyan-500/20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cyan-100 truncate">
                {user.email}
              </p>
              <p className="text-xs text-cyan-300/60">User Account</p>
            </div>
          </div>

          <Link
            href="/auth/sign-out"
            className="flex items-center gap-3 px-4 py-3 mt-2 rounded-lg transition-all hover:bg-red-500/10 hover:border-red-500/30 border border-transparent text-red-300/80 hover:text-red-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
