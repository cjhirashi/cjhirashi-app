/**
 * Server Component: New Agent Page (Admin only)
 */

import { requireAdmin } from '@/lib/auth/require-auth';
import { AgentForm } from '@/components/agents/AgentForm';
import { createAgent } from '@/app/actions/agents';

export default async function NewAgentPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Create New Agent</h1>
          <p className="text-muted-foreground">
            Configure a new AI agent with capabilities and model settings
          </p>
        </div>
        <AgentForm onSubmit={createAgent} />
      </div>
    </div>
  );
}
