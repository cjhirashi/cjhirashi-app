'use client';

/**
 * Client Component for Agent form (create/edit) - Admin only
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Agent } from '@/lib/types/database';

interface AgentFormProps {
  agent?: Agent;
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  isLoading?: boolean;
}

export function AgentForm({ agent, onSubmit, isLoading = false }: AgentFormProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>{agent ? 'Edit Agent' : 'Create New Agent'}</CardTitle>
        <CardDescription>
          Configure AI agent capabilities and model settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={agent?.name}
                  placeholder="Code Assistant"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={agent?.description || ''}
                  placeholder="Describe this agent's purpose..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  defaultValue={agent?.specialization || ''}
                  placeholder="e.g., Frontend Development, Data Analysis"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={agent?.is_active !== false}
                  disabled={loading}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="has_project_capability"
                  name="has_project_capability"
                  defaultChecked={agent?.has_project_capability}
                  disabled={loading}
                />
                <Label htmlFor="has_project_capability">Project Capability</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allows_global_corpus"
                  name="allows_global_corpus"
                  defaultChecked={agent?.allows_global_corpus}
                  disabled={loading}
                />
                <Label htmlFor="allows_global_corpus">Allow Global Corpus</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allows_personal_corpus"
                  name="allows_personal_corpus"
                  defaultChecked={agent?.allows_personal_corpus}
                  disabled={loading}
                />
                <Label htmlFor="allows_personal_corpus">Allow Personal Corpus</Label>
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-6 mt-4">
              {(['economy', 'balanced', 'premium'] as const).map((tier) => (
                <Card key={tier}>
                  <CardHeader>
                    <CardTitle className="text-base capitalize">{tier} Tier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`${tier}_provider`}>Provider</Label>
                        <Input
                          id={`${tier}_provider`}
                          name={`${tier}_provider`}
                          placeholder="openai"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${tier}_model`}>Model</Label>
                        <Input
                          id={`${tier}_model`}
                          name={`${tier}_model`}
                          placeholder="gpt-4"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${tier}_prompt`}>System Prompt</Label>
                      <Textarea
                        id={`${tier}_prompt`}
                        name={`${tier}_prompt`}
                        placeholder="You are a helpful assistant..."
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
            </Button>
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
