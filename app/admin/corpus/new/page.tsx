/**
 * Server Component: New Global Corpus Page (Admin only)
 */

import { requireAdmin } from '@/lib/auth/require-auth';
import { CorpusForm } from '@/components/corpus/CorpusForm';
import { createCorpus } from '@/app/actions/corpus';

export default async function NewGlobalCorpusPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Create Global Corpus</h1>
          <p className="text-muted-foreground">
            Create a global knowledge base available to all agents
          </p>
        </div>
        <CorpusForm corpusType="global" onSubmit={createCorpus} />
      </div>
    </div>
  );
}
