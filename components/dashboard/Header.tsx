/**
 * Dashboard Header - Glassmorphic Top Bar
 */

'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
}

export function DashboardHeader({ user }: HeaderProps) {
  return (
    <header className="border-b border-cyan-500/20 backdrop-blur-xl bg-slate-900/50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300/60" />
            <Input
              type="search"
              placeholder="Search agents, projects..."
              className="pl-10 bg-cyan-500/5 border-cyan-500/20 text-cyan-100 placeholder:text-cyan-300/40 focus:border-cyan-500/40"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-cyan-500/10 text-cyan-300/80 hover:text-cyan-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-cyan-400 rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
}
