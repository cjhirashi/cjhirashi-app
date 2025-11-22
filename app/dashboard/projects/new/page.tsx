/**
 * Server Component: New Project Page
 */

import { requireAuth } from '@/lib/auth/require-auth';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { createProject } from '@/app/actions/projects';

export default async function NewProjectPage() {
  await requireAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Start a new project with an AI agent
          </p>
        </div>
        <ProjectForm onSubmit={createProject} />
      </div>
    </div>
  );
}
