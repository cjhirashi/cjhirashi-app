/**
 * Project Card - Display project information
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderKanban, Bot, Calendar } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    updated_at: Date;
    agent?: {
      name: string;
      specialization?: string | null;
    } | null;
  };
  className?: string;
}

const statusColors = {
  active: 'bg-green-500/10 text-green-300 border-green-500/30',
  archived: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  completed: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
};

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-cyan-500/20 backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-900/30 p-6',
        'hover:border-cyan-500/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10',
        className
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative space-y-4">
        {/* Icon and status */}
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <FolderKanban className="h-6 w-6 text-cyan-400" />
          </div>

          <Badge
            variant="outline"
            className={cn('text-xs', statusColors[project.status as keyof typeof statusColors])}
          >
            {project.status}
          </Badge>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-cyan-100 line-clamp-1">
            {project.name}
          </h3>

          {project.description && (
            <p className="text-sm text-cyan-300/70 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-2 pt-2 border-t border-cyan-500/10">
          {project.agent && (
            <div className="flex items-center gap-2 text-xs text-cyan-300/60">
              <Bot className="h-3 w-3" />
              <span>{project.agent.name}</span>
              {project.agent.specialization && (
                <Badge variant="secondary" className="text-xs bg-cyan-500/10 text-cyan-300 border-0">
                  {project.agent.specialization}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-cyan-300/60">
            <Calendar className="h-3 w-3" />
            <span>Updated {formatDistance(new Date(project.updated_at), new Date(), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Action */}
        <Link href={`/dashboard/projects/${project.id}`}>
          <Button
            variant="outline"
            className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            Open Project
          </Button>
        </Link>
      </div>
    </div>
  );
}
