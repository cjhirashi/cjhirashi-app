/**
 * Server Component: Edit Agent Page (Admin only)
 */

import { requireAdmin } from '@/lib/auth/require-auth';
import { createClient } from '@/lib/supabase/server';
import { AgentForm } from '@/components/agents/AgentForm';
import { updateAgent, deleteAgent } from '@/app/actions/agents';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface EditAgentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !agent) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Agent</h1>
            <p className="text-muted-foreground">
              Update agent configuration and settings
            </p>
          </div>
          <form action={deleteAgent.bind(null, id)}>
            <Button type="submit" variant="destructive">
              Delete Agent
            </Button>
          </form>
        </div>
        <AgentForm agent={agent} onSubmit={(formData) => updateAgent(id, formData)} />
      </div>
    </div>
  );
}
