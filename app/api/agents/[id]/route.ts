/**
 * User API - Agent Details
 * GET /api/agents/[id] - Get agent details (active only)
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/helpers';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET - Get agent details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const agent = await prisma.agents.findFirst({
      where: {
        id,
        is_active: true, // Only allow access to active agents
      },
      select: {
        id: true,
        name: true,
        description: true,
        specialization: true,
        has_project_capability: true,
        project_type: true,
        allows_global_corpus: true,
        allows_personal_corpus: true,
        capabilities: true,
        agent_models: {
          select: {
            id: true,
            tier: true,
            model_provider: true,
            model_name: true,
            system_prompt: true,
            temperature: true,
            max_tokens: true,
          },
          orderBy: { tier: 'asc' },
        },
        agent_corpus_assignments: {
          where: {
            corpus: {
              is_active: true,
            },
          },
          include: {
            corpus: {
              select: {
                id: true,
                name: true,
                description: true,
                corpus_type: true,
                tags: true,
              },
            },
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    if (!agent) {
      return apiError('Agent not found or inactive', undefined, 404);
    }

    return apiSuccess(agent);
  } catch (error) {
    return handleApiError(error);
  }
}
