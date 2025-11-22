/**
 * Admin API - Corpus Details
 * GET /api/admin/corpus/[id] - Get corpus details
 * PUT /api/admin/corpus/[id] - Update corpus
 * DELETE /api/admin/corpus/[id] - Delete corpus
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/helpers';
import { requireApiRole } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { updateCorpusSchema } from '@/lib/validation/schemas';

/**
 * GET - Get corpus details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiRole(request, 'moderator');
    const { id } = await params;

    const corpus = await prisma.corpora.findUnique({
      where: { id },
      include: {
        created_by_user: {
          select: {
            id: true,
            email: true,
          },
        },
        owner_user: {
          select: {
            id: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
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
            assigned_by_user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        embeddings: {
          select: {
            id: true,
            qdrant_point_id: true,
            created_at: true,
          },
          take: 10,
        },
      },
    });

    if (!corpus) {
      return apiError('Corpus not found', undefined, 404);
    }

    return apiSuccess(corpus);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT - Update corpus
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiRole(request, 'admin');
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateCorpusSchema.parse(body);

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
 * DELETE - Delete corpus
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiRole(request, 'admin');
    const { id } = await params;

    // Check if corpus has embeddings
    const embeddingsCount = await prisma.embeddings.count({
      where: { corpus_id: id },
    });

    if (embeddingsCount > 0) {
      return apiError(
        'Cannot delete corpus with embeddings. Deactivate instead.',
        { embeddingsCount },
        400
      );
    }

    await prisma.corpora.delete({
      where: { id },
    });

    return apiSuccess(null, 'Corpus deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
