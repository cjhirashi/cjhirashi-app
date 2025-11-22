/**
 * Server Component: Edit Global Corpus Page (Admin only)
 */

import { requireAdmin } from '@/lib/auth/require-auth';
import { createClient } from '@/lib/supabase/server';
import { CorpusForm } from '@/components/corpus/CorpusForm';
import { updateCorpus, deleteCorpus } from '@/app/actions/corpus';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface EditCorpusPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGlobalCorpusPage({ params }: EditCorpusPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: corpus, error } = await supabase
    .from('corpus')
    .select('*')
    .eq('id', id)
    .eq('corpus_type', 'global')
    .single();

  if (error || !corpus) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Global Corpus</h1>
            <p className="text-muted-foreground">
              Update global knowledge base settings
            </p>
          </div>
          <form action={deleteCorpus.bind(null, id)}>
            <Button type="submit" variant="destructive">
              Delete Corpus
            </Button>
          </form>
        </div>
        <CorpusForm
          corpus={corpus}
          corpusType="global"
          onSubmit={(formData) => updateCorpus(id, formData)}
        />
      </div>
    </div>
  );
}
