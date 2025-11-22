/**
 * Chat API - Streaming Chat with Vercel AI SDK
 * POST /api/chat - Send message and get streaming response
 *
 * PLACEHOLDER: RAG implementation pending (will be added in AI integration phase)
 */

import { NextRequest } from 'next/server';
import { apiError, handleApiError } from '@/lib/api/helpers';
import { requireAuth } from '@/lib/api/auth';
import { prisma } from '@/lib/db/prisma';
import { chatRequestSchema } from '@/lib/validation/schemas';

/**
 * POST - Send chat message (placeholder)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = chatRequestSchema.parse(body);

    // Verify agent exists and is active
    const agent = await prisma.agents.findFirst({
      where: {
        id: validatedData.agent_id,
        is_active: true,
      },
      include: {
        agent_models: {
          where: {
            tier: validatedData.model_tier,
          },
        },
      },
    });

    if (!agent) {
      return apiError('Agent not found or inactive', undefined, 404);
    }

    if (!agent.agent_models.length) {
      return apiError(`No ${validatedData.model_tier} model configured for this agent`, undefined, 400);
    }

    // Verify project ownership if project_id provided
    if (validatedData.project_id) {
      const project = await prisma.projects.findFirst({
        where: {
          id: validatedData.project_id,
          user_id: user.id,
        },
      });

      if (!project) {
        return apiError('Project not found or access denied', undefined, 404);
      }
    }

    // Create or get conversation
    let conversationId = validatedData.conversation_id;

    if (!conversationId) {
      const conversation = await prisma.conversations.create({
        data: {
          user_id: user.id,
          agent_id: validatedData.agent_id,
          project_id: validatedData.project_id,
          title: validatedData.message.slice(0, 100),
          messages: [
            {
              role: 'user',
              content: validatedData.message,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });
      conversationId = conversation.id;
    } else {
      // Verify conversation ownership
      const conversation = await prisma.conversations.findFirst({
        where: {
          id: conversationId,
          user_id: user.id,
        },
      });

      if (!conversation) {
        return apiError('Conversation not found or access denied', undefined, 404);
      }

      // Add message to conversation
      await prisma.conversations.update({
        where: { id: conversationId },
        data: {
          messages: {
            push: {
              role: 'user',
              content: validatedData.message,
              timestamp: new Date().toISOString(),
            },
          },
          updated_at: new Date(),
        },
      });
    }

    // PLACEHOLDER: Actual Vercel AI SDK streaming will be implemented here
    // For now, return a simple mock response
    const mockResponse = {
      success: true,
      data: {
        conversation_id: conversationId,
        message: 'PLACEHOLDER: Streaming response will be implemented with Vercel AI SDK + RAG',
        model: agent.agent_models[0],
      },
      message: 'Chat API placeholder. Full implementation pending.',
    };

    return Response.json(mockResponse);
  } catch (error) {
    return handleApiError(error);
  }
}
