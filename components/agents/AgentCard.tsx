/**
 * Agent Card - Display agent information
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Zap } from 'lucide-react';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description?: string | null;
    specialization?: string | null;
    has_project_capability: boolean;
    project_type?: string | null;
    agent_models?: Array<{
      tier: string;
    }>;
  };
  className?: string;
}

export function AgentCard({ agent, className }: AgentCardProps) {
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
        {/* Icon and badges */}
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Bot className="h-6 w-6 text-cyan-400" />
          </div>

          <div className="flex flex-wrap gap-1 justify-end">
            {agent.has_project_capability && (
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Projects
              </Badge>
            )}
            {agent.specialization && (
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                {agent.specialization}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-cyan-100 line-clamp-1">
            {agent.name}
          </h3>

          {agent.description && (
            <p className="text-sm text-cyan-300/70 line-clamp-2">
              {agent.description}
            </p>
          )}
        </div>

        {/* Models */}
        {agent.agent_models && agent.agent_models.length > 0 && (
          <div className="flex items-center gap-1 pt-2 border-t border-cyan-500/10">
            <p className="text-xs text-cyan-300/60">Models:</p>
            <div className="flex gap-1">
              {agent.agent_models.map((model) => (
                <Badge
                  key={model.tier}
                  variant="secondary"
                  className="text-xs bg-cyan-500/10 text-cyan-300 border-0"
                >
                  {model.tier}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        <Link href={`/dashboard/agents/${agent.id}`}>
          <Button
            variant="outline"
            className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
