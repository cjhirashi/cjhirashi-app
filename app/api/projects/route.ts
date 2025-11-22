/**
 * User API - Projects
 * GET /api/projects - List my projects
 * POST /api/projects - Create new project
 */

import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api/helpers';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { createProjectSchema } from '@/lib/validation/schemas';

/**
 * GET - List my projects
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agent_id = searchParams.get('agent_id');

    const where: any = {
      user_id: user.id, // Only show user's own projects
    };

    if (status) where.status = status;
    if (agent_id) where.agent_id = agent_id;

    const projects = await prisma.projects.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            specialization: true,
            project_type: true,
          },
        },
        conversations: {
          select: {
            id: true,
            title: true,
            updated_at: true,
          },
          orderBy: { updated_at: 'desc' },
          take: 3,
        },
        corpora: {
          where: {
            is_active: true,
          },
          select: {
            id: true,
            name: true,
            corpus_type: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return apiSuccess(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST - Create new project
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Verify agent exists and is active
    const agent = await prisma.agents.findFirst({
      where: {
        id: validatedData.agent_id,
        is_active: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found or inactive');
    }

    // Inherit project_type from agent if not specified
    const project = await prisma.projects.create({
      data: {
        ...validatedData,
        user_id: user.id,
        project_type: validatedData.project_type || agent.project_type,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    });

    return apiSuccess(project, 'Project created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
