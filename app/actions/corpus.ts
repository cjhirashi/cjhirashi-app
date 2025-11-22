'use server';

/**
 * Server Actions for Corpus management
 */

import { createClient } from '@/lib/supabase/server';
import { createCorpusSchema, updateCorpusSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCorpus(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    corpus_type: formData.get('corpus_type') as 'global' | 'personal',
    is_active: true,
  };

  const validation = createCorpusSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { error } = await supabase
    .from('corpus')
    .insert({
      ...validation.data,
      user_id: user.id,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/corpus');
  revalidatePath('/admin/corpus');
  redirect(rawData.corpus_type === 'global' ? '/admin/corpus' : '/dashboard/corpus');
}

export async function updateCorpus(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    is_active: formData.get('is_active') === 'true',
  };

  const validation = updateCorpusSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { error } = await supabase
    .from('corpus')
    .update(validation.data)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/corpus');
  revalidatePath('/admin/corpus');
  revalidatePath(`/dashboard/corpus/${id}`);
  revalidatePath(`/admin/corpus/${id}`);
  return { success: true };
}

export async function deleteCorpus(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('corpus')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/corpus');
  revalidatePath('/admin/corpus');
  redirect('/dashboard/corpus');
}
