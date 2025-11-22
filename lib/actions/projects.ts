/**
 * Server Actions - Projects Management (User)
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/api/auth';
import { createProjectSchema, updateProjectSchema } from '@/lib/validation/schemas';
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validation/schemas';

/**
 * Create new project
 */
export async function createProject(data: CreateProjectInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const validatedData = createProjectSchema.parse(data);

    // Verify agent exists and is active
    const agent = await prisma.agents.findFirst({
      where: {
        id: validatedData.agent_id,
        is_active: true,
      },
    });

    if (!agent) {
      return { success: false, error: 'Agent not found or inactive' };
    }

    const project = await prisma.projects.create({
      data: {
        ...validatedData,
        user_id: user.id,
        project_type: validatedData.project_type || agent.project_type,
      },
    });

    revalidatePath('/dashboard/projects');
    return { success: true, data: project };
  } catch (error) {
    console.error('Create project error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}

/**
 * Update project
 */
export async function updateProject(id: string, data: UpdateProjectInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify ownership
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    });

    if (!existingProject) {
      return { success: false, error: 'Project not found or access denied' };
    }

    const validatedData = updateProjectSchema.parse(data);

    const project = await prisma.projects.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${id}`);
    return { success: true, data: project };
  } catch (error) {
    console.error('Update project error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    };
  }
}

/**
 * Delete project
 */
export async function deleteProject(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify ownership
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    });

    if (!existingProject) {
      return { success: false, error: 'Project not found or access denied' };
    }

    await prisma.projects.delete({
      where: { id },
    });

    revalidatePath('/dashboard/projects');
    redirect('/dashboard/projects');
  } catch (error) {
    console.error('Delete project error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    };
  }
}
