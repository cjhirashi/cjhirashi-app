/**
 * User API - Corpus Details
 * GET /api/corpus/[id] - Get corpus details (ownership/access verified)
 * PUT /api/corpus/[id] - Update corpus (ownership verified)
 * DELETE /api/corpus/[id] - Delete corpus (ownership verified)
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/helpers';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { updateCorpusSchema } from '@/lib/validation/schemas';

/**
 * GET - Get corpus details (verify access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const corpus = await prisma.corpora.findFirst({
      where: {
        id,
        OR: [
          // Own personal corpus
          {
            corpus_type: 'personal',
            owner_user_id: user.id,
          },
          // Active global corpus
          {
            corpus_type: 'global',
            is_active: true,
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        corpus_documents: {
          include: {
            uploaded_by_user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        agent_corpus_assignments: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                specialization: true,
              },
            },
          },
        },
        embeddings: {
          select: {
            id: true,
            chunk_index: true,
            created_at: true,
          },
          take: 10,
        },
      },
    });

    if (!corpus) {
      return apiError('Corpus not found or access denied', undefined, 404);
    }

    return apiSuccess(corpus);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT - Update corpus (ownership verified)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership (only personal corpus owners can update)
    const existingCorpus = await prisma.corpora.findFirst({
      where: {
        id,
        corpus_type: 'personal',
        owner_user_id: user.id,
      },
    });

    if (!existingCorpus) {
      return apiError('Corpus not found, access denied, or not personal corpus', undefined, 403);
    }

    const body = await request.json();
    const validatedData = updateCorpusSchema.parse(body);

    // Prevent changing corpus_type
    delete (validatedData as any).corpus_type;

    const corpus = await prisma.corpora.update({
      where: { id },
      data: validatedData,
      include: {
        corpus_documents: {
          select: {
            id: true,
            filename: true,
            status: true,
          },
        },
      },
    });

    return apiSuccess(corpus, 'Corpus updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE - Delete corpus (ownership verified)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership
    const existingCorpus = await prisma.corpora.findFirst({
      where: {
        id,
        corpus_type: 'personal',
        owner_user_id: user.id,
      },
    });

    if (!existingCorpus) {
      return apiError('Corpus not found, access denied, or not personal corpus', undefined, 403);
    }

    await prisma.corpora.delete({
      where: { id },
    });

    return apiSuccess(null, 'Corpus deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
