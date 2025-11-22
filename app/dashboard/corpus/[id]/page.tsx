/**
 * Server Component: Personal Corpus Detail Page
 */

import { requireAuth } from '@/lib/auth/require-auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { deleteCorpus } from '@/app/actions/corpus';
import Link from 'next/link';
import { Settings, Trash2, Upload, FileText } from 'lucide-react';

interface CorpusDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CorpusDetailPage({ params }: CorpusDetailPageProps) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: corpus, error } = await supabase
    .from('corpus')
    .select(`
      *,
      corpus_documents (
        id,
        filename,
        file_size,
        uploaded_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('corpus_type', 'personal')
    .single();

  if (error || !corpus) {
    notFound();
  }

  const documents = corpus.corpus_documents || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{corpus.name}</h1>
            <p className="text-muted-foreground">{corpus.description || 'No description'}</p>
          </div>
          <Badge variant={corpus.is_active ? 'default' : 'secondary'}>
            {corpus.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle>Corpus Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Type:</span>
              <p className="font-medium capitalize">{corpus.corpus_type}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Created:</span>
              <p className="font-medium">
                {new Date(corpus.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Documents:</span>
              <p className="font-medium">{documents.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Document upload and indexing will be implemented in Phase 15
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded yet</p>
                <p className="text-sm mt-1">Document upload coming in Phase 15</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {doc.file_size && (
                      <span className="text-sm text-muted-foreground">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/corpus/${id}/edit`}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Corpus
            </Link>
          </Button>
          <form action={deleteCorpus.bind(null, id)} className="ml-auto">
            <Button type="submit" variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Corpus
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
