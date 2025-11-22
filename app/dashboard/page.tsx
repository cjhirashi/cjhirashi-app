/**
 * Dashboard Home - Overview with metrics
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Bot, FolderKanban, Database, MessageSquare } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user metrics
  const [projectsCount, activeProjects, corpusCount, conversationsCount] =
    await Promise.all([
      prisma.projects.count({
        where: { user_id: user.id },
      }),
      prisma.projects.count({
        where: {
          user_id: user.id,
          status: 'active',
        },
      }),
      prisma.corpora.count({
        where: {
          owner_user_id: user.id,
          is_active: true,
        },
      }),
      prisma.conversations.count({
        where: { user_id: user.id },
      }),
    ]);

  const availableAgents = await prisma.agents.count({
    where: { is_active: true },
  });

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-cyan-100">
          Welcome back! 👋
        </h1>
        <p className="text-cyan-300/60">
          Here's an overview of your AI workspace
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Available Agents"
          value={availableAgents}
          description="AI assistants ready to use"
          icon={Bot}
        />

        <DashboardCard
          title="Active Projects"
          value={activeProjects}
          description={`${projectsCount} total projects`}
          icon={FolderKanban}
        />

        <DashboardCard
          title="My Corpus"
          value={corpusCount}
          description="Personal knowledge bases"
          icon={Database}
        />

        <DashboardCard
          title="Conversations"
          value={conversationsCount}
          description="Total chat sessions"
          icon={MessageSquare}
        />
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-cyan-500/20 backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-900/30 p-6">
        <h2 className="text-xl font-semibold text-cyan-100 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <Bot className="h-8 w-8 text-cyan-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-cyan-100">
                Get started by exploring available agents
              </p>
              <p className="text-xs text-cyan-300/60">
                Navigate to Agents to see what's available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <FolderKanban className="h-8 w-8 text-cyan-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-cyan-100">
                Create your first project
              </p>
              <p className="text-xs text-cyan-300/60">
                Start collaborating with AI agents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
