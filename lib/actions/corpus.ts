/**
 * Server Actions - Corpus Management (User + Admin)
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/api/auth';
import { isAdmin } from '@/lib/api/auth';
import { createCorpusSchema, updateCorpusSchema, uploadDocumentSchema } from '@/lib/validation/schemas';
import type { CreateCorpusInput, UpdateCorpusInput, UploadDocumentInput } from '@/lib/validation/schemas';

/**
 * Create new corpus (admin = global, user = personal)
 */
export async function createCorpus(data: CreateCorpusInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const validatedData = createCorpusSchema.parse(data);

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id);

    // Determine corpus type based on role
    const corpusType = userIsAdmin && validatedData.corpus_type === 'global' ? 'global' : 'personal';

    // Verify project ownership if project_id is provided
    if (validatedData.project_id) {
      const project = await prisma.projects.findFirst({
        where: {
          id: validatedData.project_id,
          user_id: user.id,
        },
      });

      if (!project) {
        return { success: false, error: 'Project not found or access denied' };
      }
    }

    const corpus = await prisma.corpora.create({
      data: {
        ...validatedData,
        corpus_type: corpusType,
        created_by: user.id,
        owner_user_id: corpusType === 'personal' ? user.id : null,
      },
    });

    revalidatePath('/dashboard/corpus');
    if (userIsAdmin) {
      revalidatePath('/admin/corpus');
    }

    return { success: true, data: corpus };
  } catch (error) {
    console.error('Create corpus error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create corpus',
    };
  }
}

/**
 * Update corpus
 */
export async function updateCorpus(id: string, data: UpdateCorpusInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const userIsAdmin = await isAdmin(user.id);

    // Verify ownership or admin access
    const existingCorpus = await prisma.corpora.findFirst({
      where: userIsAdmin
        ? { id }
        : {
            id,
            corpus_type: 'personal',
            owner_user_id: user.id,
          },
    });

    if (!existingCorpus) {
      return { success: false, error: 'Corpus not found or access denied' };
    }

    const validatedData = updateCorpusSchema.parse(data);

    // Prevent changing corpus_type (immutable)
    delete (validatedData as any).corpus_type;

    const corpus = await prisma.corpora.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/dashboard/corpus');
    revalidatePath(`/dashboard/corpus/${id}`);
    if (userIsAdmin) {
      revalidatePath('/admin/corpus');
      revalidatePath(`/admin/corpus/${id}`);
    }

    return { success: true, data: corpus };
  } catch (error) {
    console.error('Update corpus error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update corpus',
    };
  }
}

/**
 * Delete corpus
 */
export async function deleteCorpus(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const userIsAdmin = await isAdmin(user.id);

    // Verify ownership or admin access
    const existingCorpus = await prisma.corpora.findFirst({
      where: userIsAdmin
        ? { id }
        : {
            id,
            corpus_type: 'personal',
            owner_user_id: user.id,
          },
    });

    if (!existingCorpus) {
      return { success: false, error: 'Corpus not found or access denied' };
    }

    await prisma.corpora.delete({
      where: { id },
    });

    revalidatePath('/dashboard/corpus');
    if (userIsAdmin) {
      revalidatePath('/admin/corpus');
    }

    redirect('/dashboard/corpus');
  } catch (error) {
    console.error('Delete corpus error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete corpus',
    };
  }
}

/**
 * Upload document to corpus
 */
export async function uploadDocument(data: UploadDocumentInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const validatedData = uploadDocumentSchema.parse(data);

    // Verify corpus access
    const corpus = await prisma.corpora.findFirst({
      where: {
        id: validatedData.corpus_id,
        OR: [
          { corpus_type: 'global' },
          {
            corpus_type: 'personal',
            owner_user_id: user.id,
          },
        ],
      },
    });

    if (!corpus) {
      return { success: false, error: 'Corpus not found or access denied' };
    }

    const document = await prisma.corpus_documents.create({
      data: {
        ...validatedData,
        uploaded_by: user.id,
        status: 'pending',
      },
    });

    revalidatePath('/dashboard/corpus');
    revalidatePath(`/dashboard/corpus/${validatedData.corpus_id}`);

    return { success: true, data: document };
  } catch (error) {
    console.error('Upload document error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    };
  }
}
