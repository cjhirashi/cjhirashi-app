/**
 * User API - Project Details
 * GET /api/projects/[id] - Get project details (own projects only)
 * PUT /api/projects/[id] - Update project
 * DELETE /api/projects/[id] - Delete project
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/helpers';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { updateProjectSchema } from '@/lib/validation/schemas';

/**
 * GET - Get project details (ownership verified)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const project = await prisma.projects.findFirst({
      where: {
        id,
        user_id: user.id, // Verify ownership
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            description: true,
            specialization: true,
            project_type: true,
            agent_models: {
              select: {
                tier: true,
                model_provider: true,
                model_name: true,
              },
            },
          },
        },
        conversations: {
          orderBy: { updated_at: 'desc' },
          select: {
            id: true,
            title: true,
            created_at: true,
            updated_at: true,
          },
        },
        corpora: {
          where: {
            is_active: true,
          },
          include: {
            corpus_documents: {
              select: {
                id: true,
                filename: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return apiError('Project not found or access denied', undefined, 404);
    }

    return apiSuccess(project);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT - Update project (ownership verified)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership first
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    });

    if (!existingProject) {
      return apiError('Project not found or access denied', undefined, 404);
    }

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const project = await prisma.projects.update({
      where: { id },
      data: validatedData,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiSuccess(project, 'Project updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE - Delete project (ownership verified)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership first
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    });

    if (!existingProject) {
      return apiError('Project not found or access denied', undefined, 404);
    }

    await prisma.projects.delete({
      where: { id },
    });

    return apiSuccess(null, 'Project deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
