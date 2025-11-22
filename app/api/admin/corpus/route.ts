/**
 * Admin API - Corpus Management (Global)
 * GET /api/admin/corpus - List all corpus (global + personal)
 * POST /api/admin/corpus - Create new global corpus
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/helpers';
import { requireApiRole } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { createCorpusSchema } from '@/lib/validation/schemas';

/**
 * GET - List all corpus (admin/moderator)
 */
export async function GET(request: NextRequest) {
  try {
    await requireApiRole(request, 'moderator');

    const { searchParams } = new URL(request.url);
    const corpus_type = searchParams.get('corpus_type');
    const is_active = searchParams.get('is_active');

    const where: any = {};
    if (corpus_type) where.corpus_type = corpus_type;
    if (is_active !== null) where.is_active = is_active === 'true';

    const corpora = await prisma.corpora.findMany({
      where,
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
          },
        },
        corpus_documents: {
          select: {
            id: true,
            filename: true,
            status: true,
          },
        },
        agent_corpus_assignments: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return apiSuccess(corpora);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST - Create new global corpus (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiRole(request, 'admin');

    const body = await request.json();
    const validatedData = createCorpusSchema.parse(body);

    // Force global type for admin-created corpus
    const corpus = await prisma.corpora.create({
      data: {
        ...validatedData,
        corpus_type: 'global',
        created_by: user.id,
        owner_user_id: null, // Global corpus has no owner
      },
      include: {
        created_by_user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return apiSuccess(corpus, 'Global corpus created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
