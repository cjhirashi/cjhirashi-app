/**
 * User API - Agents
 * GET /api/agents - List available agents (active only)
 */

import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api/helpers';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET - List available agents (authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const has_project_capability = searchParams.get('has_project_capability');
    const project_type = searchParams.get('project_type');

    const where: any = {
      is_active: true, // Only show active agents to users
    };

    if (has_project_capability !== null) {
      where.has_project_capability = has_project_capability === 'true';
    }
    if (project_type) {
      where.project_type = project_type;
    }

    const agents = await prisma.agents.findMany({
      where,
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
            temperature: true,
            max_tokens: true,
          },
          orderBy: { tier: 'asc' },
        },
        created_at: true,
        updated_at: true,
      },
      orderBy: [
        { has_project_capability: 'desc' },
        { name: 'asc' },
      ],
    });

    return apiSuccess(agents);
  } catch (error) {
    return handleApiError(error);
  }
}
