/**
 * Server Actions - Agents Management (Admin)
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth/require-admin';
import { createAgentSchema, updateAgentSchema } from '@/lib/validation/schemas';
import type { CreateAgentInput, UpdateAgentInput } from '@/lib/validation/schemas';

/**
 * Create new agent
 */
export async function createAgent(data: CreateAgentInput) {
  try {
    const admin = await requireAdmin();

    const validatedData = createAgentSchema.parse(data);

    const agent = await prisma.agents.create({
      data: {
        ...validatedData,
        created_by: admin.id,
      },
    });

    revalidatePath('/admin/agents');
    return { success: true, data: agent };
  } catch (error) {
    console.error('Create agent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create agent',
    };
  }
}

/**
 * Update agent
 */
export async function updateAgent(id: string, data: UpdateAgentInput) {
  try {
    await requireAdmin();

    const validatedData = updateAgentSchema.parse(data);

    const agent = await prisma.agents.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/admin/agents');
    revalidatePath(`/admin/agents/${id}`);
    return { success: true, data: agent };
  } catch (error) {
    console.error('Update agent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update agent',
    };
  }
}

/**
 * Delete agent
 */
export async function deleteAgent(id: string) {
  try {
    await requireAdmin();

    // Check for active projects
    const projectCount = await prisma.projects.count({
      where: {
        agent_id: id,
        status: 'active',
      },
    });

    if (projectCount > 0) {
      return {
        success: false,
        error: `Cannot delete agent with ${projectCount} active projects`,
      };
    }

    await prisma.agents.delete({
      where: { id },
    });

    revalidatePath('/admin/agents');
    redirect('/admin/agents');
  } catch (error) {
    console.error('Delete agent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete agent',
    };
  }
}
