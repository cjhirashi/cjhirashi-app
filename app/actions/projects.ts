'use server';

/**
 * Server Actions for Project management
 */

import { createClient } from '@/lib/supabase/server';
import { createProjectSchema, updateProjectSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    agent_id: formData.get('agent_id') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    project_type: formData.get('project_type') as string || undefined,
    status: 'active' as const,
  };

  const validation = createProjectSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { error } = await supabase
    .from('projects')
    .insert({
      ...validation.data,
      user_id: user.id,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects');
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    status: formData.get('status') as 'active' | 'archived' | 'completed',
  };

  const validation = updateProjectSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { error } = await supabase
    .from('projects')
    .update(validation.data)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${id}`);
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects');
}
