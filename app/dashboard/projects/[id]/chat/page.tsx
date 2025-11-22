/**
 * Server Component: Project Chat Page
 */

import { requireAuth } from '@/lib/auth/require-auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ProjectChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectChatPage({ params }: ProjectChatPageProps) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      agents (
        id,
        name,
        specialization
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/projects/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              Chat with {project.agents?.name}
            </p>
          </div>
        </div>

        <ChatInterface
          projectId={id}
          agentId={project.agent_id}
          agentName={project.agents?.name}
        />
      </div>
    </div>
  );
}
