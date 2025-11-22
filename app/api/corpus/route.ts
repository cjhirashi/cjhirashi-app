/**
 * User API - Corpus (Personal)
 * GET /api/corpus - List my personal corpus
 * POST /api/corpus - Create new personal corpus
 */

import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api/helpers';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { createCorpusSchema } from '@/lib/validation/schemas';

/**
 * GET - List my personal corpus + accessible global corpus
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get('is_active');
    const project_id = searchParams.get('project_id');

    const where: any = {
      OR: [
        // My personal corpus
        {
          corpus_type: 'personal',
          owner_user_id: user.id,
        },
        // Global corpus (accessible to all)
        {
          corpus_type: 'global',
          is_active: true,
        },
      ],
    };

    if (is_active !== null) {
      where.is_active = is_active === 'true';
    }
    if (project_id) {
      where.project_id = project_id;
    }

    const corpora = await prisma.corpora.findMany({
      where,
      include: {
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
            file_size: true,
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
      orderBy: { updated_at: 'desc' },
    });

    return apiSuccess(corpora);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST - Create new personal corpus
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = createCorpusSchema.parse(body);

    // Verify project ownership if project_id is provided
    if (validatedData.project_id) {
      const project = await prisma.projects.findFirst({
        where: {
          id: validatedData.project_id,
          user_id: user.id,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }
    }

    // Force personal type for user-created corpus
    const corpus = await prisma.corpora.create({
      data: {
        ...validatedData,
        corpus_type: 'personal',
        created_by: user.id,
        owner_user_id: user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiSuccess(corpus, 'Personal corpus created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
