/**
 * Dashboard Projects - List user's projects
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const projects = await prisma.projects.findMany({
    where: {
      user_id: user.id,
    },
    include: {
      agent: {
        select: {
          name: true,
          specialization: true,
        },
      },
    },
    orderBy: { updated_at: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <FolderKanban className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cyan-100">My Projects</h1>
            <p className="text-sm text-cyan-300/60">
              Manage your AI-assisted projects
            </p>
          </div>
        </div>

        <Link href="/dashboard/projects/new">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-cyan-500/20 backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-900/30 p-12 text-center">
          <FolderKanban className="h-12 w-12 text-cyan-400/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-cyan-100 mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-cyan-300/60 mb-6">
            Create your first project to start collaborating with AI agents
          </p>
          <Link href="/dashboard/projects/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
