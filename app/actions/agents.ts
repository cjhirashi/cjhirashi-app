'use server';

/**
 * Server Actions for Agent management (Admin only)
 */

import { createClient } from '@/lib/supabase/server';
import { createAgentSchema, updateAgentSchema, createAgentModelSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function requireAdminAuth() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!userRole || userRole.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

export async function createAgent(formData: FormData) {
  try {
    await requireAdminAuth();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    specialization: formData.get('specialization') as string || undefined,
    has_project_capability: formData.get('has_project_capability') === 'true',
    allows_global_corpus: formData.get('allows_global_corpus') === 'true',
    allows_personal_corpus: formData.get('allows_personal_corpus') === 'true',
    is_active: formData.get('is_active') !== 'false',
  };

  const validation = createAgentSchema.safeParse(rawData);
  if (!validation.success) {
    const errors = validation.error.flatten();
    return { error: Object.values(errors.fieldErrors)[0]?.[0] || 'Validation failed' };
  }

  const { data: agent, error } = await supabase
    .from('agents')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create agent models for each tier
  const tiers = ['economy', 'balanced', 'premium'] as const;
  for (const tier of tiers) {
    const modelData = {
      agent_id: agent.id,
      tier,
      model_provider: formData.get(`${tier}_provider`) as string || 'openai',
      model_name: formData.get(`${tier}_model`) as string || 'gpt-4',
      system_prompt: formData.get(`${tier}_prompt`) as string || '',
      temperature: 0.7,
    };

    const modelValidation = createAgentModelSchema.safeParse(modelData);
    if (modelValidation.success) {
      await supabase.from('agent_models').insert(modelValidation.data);
    }
  }

  revalidatePath('/admin/agents');
  redirect('/admin/agents');
}

export async function updateAgent(id: string, formData: FormData) {
  try {
    await requireAdminAuth();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    specialization: formData.get('specialization') as string || undefined,
    has_project_capability: formData.get('has_project_capability') === 'true',
    allows_global_corpus: formData.get('allows_global_corpus') === 'true',
    allows_personal_corpus: formData.get('allows_personal_corpus') === 'true',
    is_active: formData.get('is_active') === 'true',
  };

  const validation = updateAgentSchema.safeParse(rawData);
  if (!validation.success) {
    const errors = validation.error.flatten();
    return { error: Object.values(errors.fieldErrors)[0]?.[0] || 'Validation failed' };
  }

  const { error } = await supabase
    .from('agents')
    .update(validation.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/agents');
  revalidatePath(`/admin/agents/${id}`);
  return { success: true };
}

export async function deleteAgent(id: string) {
  try {
    await requireAdminAuth();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/agents');
  redirect('/admin/agents');
}
