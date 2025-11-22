/**
 * Server Component: New Personal Corpus Page
 */

import { requireAuth } from '@/lib/auth/require-auth';
import { CorpusForm } from '@/components/corpus/CorpusForm';
import { createCorpus } from '@/app/actions/corpus';

export default async function NewCorpusPage() {
  await requireAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Create Personal Corpus</h1>
          <p className="text-muted-foreground">
            Create a personal knowledge base for your projects
          </p>
        </div>
        <CorpusForm corpusType="personal" onSubmit={createCorpus} />
      </div>
    </div>
  );
}
