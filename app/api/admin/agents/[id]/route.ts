/**
 * Admin API - Agent Details
 * GET /api/admin/agents/[id] - Get agent details
 * PUT /api/admin/agents/[id] - Update agent
 * DELETE /api/admin/agents/[id] - Delete agent
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/helpers';
import { requireApiRole } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { updateAgentSchema } from '@/lib/validation/schemas';

/**
 * GET - Get agent details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiRole(request, 'moderator');
    const { id } = await params;

    const agent = await prisma.agents.findUnique({
      where: { id },
      include: {
        agent_models: {
          orderBy: { tier: 'asc' },
        },
        created_by_user: {
          select: {
            id: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            user_id: true,
          },
          take: 10,
        },
        agent_corpus_assignments: {
          include: {
            corpus: {
              select: {
                id: true,
                name: true,
                corpus_type: true,
              },
            },
          },
        },
      },
    });

    if (!agent) {
      return apiError('Agent not found', undefined, 404);
    }

    return apiSuccess(agent);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT - Update agent
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiRole(request, 'admin');
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateAgentSchema.parse(body);

    const agent = await prisma.agents.update({
      where: { id },
      data: validatedData,
      include: {
        agent_models: true,
      },
    });

    return apiSuccess(agent, 'Agent updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE - Delete agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiRole(request, 'admin');
    const { id } = await params;

    // Check if agent has active projects
    const projectCount = await prisma.projects.count({
      where: {
        agent_id: id,
        status: 'active',
      },
    });

    if (projectCount > 0) {
      return apiError(
        'Cannot delete agent with active projects',
        { activeProjects: projectCount },
        400
      );
    }

    await prisma.agents.delete({
      where: { id },
    });

    return apiSuccess(null, 'Agent deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
