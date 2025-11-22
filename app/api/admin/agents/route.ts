/**
 * Admin API - Agents Management
 * GET /api/admin/agents - List all agents
 * POST /api/admin/agents - Create new agent
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/helpers';
import { requireApiRole } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { createAgentSchema } from '@/lib/validation/schemas';

/**
 * GET - List all agents (admin/moderator)
 */
export async function GET(request: NextRequest) {
  try {
    await requireApiRole(request, 'moderator');

    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get('is_active');
    const project_type = searchParams.get('project_type');

    const where: any = {};
    if (is_active !== null) where.is_active = is_active === 'true';
    if (project_type) where.project_type = project_type;

    const agents = await prisma.agents.findMany({
      where,
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
      },
      orderBy: { created_at: 'desc' },
    });

    return apiSuccess(agents);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST - Create new agent (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiRole(request, 'admin');

    const body = await request.json();
    const validatedData = createAgentSchema.parse(body);

    const agent = await prisma.agents.create({
      data: {
        ...validatedData,
        created_by: user.id,
      },
      include: {
        agent_models: true,
      },
    });

    return apiSuccess(agent, 'Agent created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
