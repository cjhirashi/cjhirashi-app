'use client';

/**
 * Client Component for Project form (create/edit)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import type { Project, Agent } from '@/lib/types/database';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSubmit, isLoading = false }: ProjectFormProps) {
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState(project?.agent_id || '');

  useEffect(() => {
    async function loadAgents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (data) {
        setAgents(data);
      }
    }
    loadAgents();
  }, []);

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
    <Card className="backdrop-blur-sm bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle>{project ? 'Edit Project' : 'Create New Project'}</CardTitle>
        <CardDescription>
          {project ? 'Update your project details' : 'Set up a new project with an AI agent'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project?.name}
              placeholder="My Awesome Project"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project?.description || ''}
              placeholder="Describe your project..."
              rows={4}
              disabled={loading}
            />
          </div>

          {!project && (
            <div className="space-y-2">
              <Label htmlFor="agent_id">AI Agent *</Label>
              <Select
                name="agent_id"
                value={selectedAgent}
                onValueChange={setSelectedAgent}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                      {agent.specialization && ` - ${agent.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="agent_id" value={selectedAgent} />
            </div>
          )}

          {project && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={project.status} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading || !selectedAgent}>
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
            {project && (
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
