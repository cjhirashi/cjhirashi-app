/**
 * Server Component: Project Detail Page
 */

import { requireAuth } from '@/lib/auth/require-auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { deleteProject } from '@/app/actions/projects';
import Link from 'next/link';
import { MessageSquare, Settings, Trash2 } from 'lucide-react';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground">{project.description || 'No description'}</p>
          </div>
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Created:</span>
                <p className="font-medium">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Updated:</span>
                <p className="font-medium">
                  {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </div>
              {project.project_type && (
                <div>
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <p className="font-medium">{project.project_type}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle>AI Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p className="font-medium">{project.agents?.name}</p>
              </div>
              {project.agents?.specialization && (
                <div>
                  <span className="text-sm text-muted-foreground">Specialization:</span>
                  <p className="font-medium">{project.agents.specialization}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button asChild>
            <Link href={`/dashboard/projects/${id}/chat`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Chat
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/projects/${id}/edit`}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
          <form action={deleteProject.bind(null, id)} className="ml-auto">
            <Button type="submit" variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
