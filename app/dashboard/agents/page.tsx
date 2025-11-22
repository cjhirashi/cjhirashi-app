/**
 * Dashboard Agents - List available agents
 */

import { prisma } from '@/lib/db/prisma';
import { AgentCard } from '@/components/agents/AgentCard';
import { Bot } from 'lucide-react';

export default async function AgentsPage() {
  const agents = await prisma.agents.findMany({
    where: {
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      specialization: true,
      has_project_capability: true,
      project_type: true,
      agent_models: {
        select: {
          tier: true,
        },
        orderBy: { tier: 'asc' },
      },
    },
    orderBy: [
      { has_project_capability: 'desc' },
      { name: 'asc' },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Bot className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cyan-100">Available Agents</h1>
            <p className="text-sm text-cyan-300/60">
              Choose an AI assistant to start working
            </p>
          </div>
        </div>
      </div>

      {/* Agents grid */}
      {agents.length === 0 ? (
        <div className="rounded-xl border border-cyan-500/20 backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-900/30 p-12 text-center">
          <Bot className="h-12 w-12 text-cyan-400/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-cyan-100 mb-2">
            No agents available
          </h3>
          <p className="text-sm text-cyan-300/60">
            Contact your administrator to create agents
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
