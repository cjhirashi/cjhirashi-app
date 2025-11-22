'use client';

/**
 * Client Component for Corpus form (create/edit)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Corpus } from '@/lib/types/database';

interface CorpusFormProps {
  corpus?: Corpus;
  corpusType: 'global' | 'personal';
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  isLoading?: boolean;
}

export function CorpusForm({ corpus, corpusType, onSubmit, isLoading = false }: CorpusFormProps) {
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className={corpusType === 'global' ? '' : 'backdrop-blur-sm bg-white/10 border-white/20'}>
      <CardHeader>
        <CardTitle>
          {corpus ? 'Edit Corpus' : `Create ${corpusType === 'global' ? 'Global' : 'Personal'} Corpus`}
        </CardTitle>
        <CardDescription>
          {corpusType === 'global'
            ? 'Global knowledge bases available to all agents'
            : 'Personal knowledge base for your projects'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Corpus Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={corpus?.name}
              placeholder="Technical Documentation"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={corpus?.description || ''}
              placeholder="Describe this knowledge base..."
              rows={4}
              disabled={loading}
            />
          </div>

          <input type="hidden" name="corpus_type" value={corpusType} />

          {corpus && (
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <select
                id="is_active"
                name="is_active"
                defaultValue={corpus.is_active ? 'true' : 'false'}
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Document upload functionality will be implemented in Phase 15 (RAG integration)
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : corpus ? 'Update Corpus' : 'Create Corpus'}
            </Button>
            {corpus && (
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
