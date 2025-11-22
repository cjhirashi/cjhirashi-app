/**
 * Zod validation schemas for API routes and forms
 */

import { z } from 'zod';

// ============================================
// AGENT SCHEMAS
// ============================================

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  specialization: z.string().max(100).optional(),
  has_project_capability: z.boolean().default(false),
  project_type: z.string().max(50).optional(),
  allows_global_corpus: z.boolean().default(false),
  allows_personal_corpus: z.boolean().default(false),
  capabilities: z.record(z.unknown()).optional(),
  is_active: z.boolean().default(true),
});

export const updateAgentSchema = createAgentSchema.partial();

export const createAgentModelSchema = z.object({
  agent_id: z.string().uuid(),
  tier: z.enum(['economy', 'balanced', 'premium']),
  model_provider: z.string().max(50),
  model_name: z.string().max(100),
  system_prompt: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().optional(),
});

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  agent_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  project_type: z.string().max(50).optional(),
  structure: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ agent_id: true });

// ============================================
// CORPUS SCHEMAS
// ============================================

export const createCorpusSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  corpus_type: z.enum(['global', 'personal']),
  project_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export const updateCorpusSchema = createCorpusSchema.partial();

export const uploadDocumentSchema = z.object({
  corpus_id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  file_url: z.string().url(),
  file_size: z.number().int().positive().optional(),
  mime_type: z.string().max(100).optional(),
});

// ============================================
// CONVERSATION SCHEMAS
// ============================================

export const createConversationSchema = z.object({
  agent_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
});

export const addMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================
// CHAT SCHEMAS
// ============================================

export const chatRequestSchema = z.object({
  agent_id: z.string().uuid(),
  conversation_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  message: z.string().min(1),
  model_tier: z.enum(['economy', 'balanced', 'premium']).default('balanced'),
  use_rag: z.boolean().default(false),
});

// ============================================
// ASSIGNMENT SCHEMAS
// ============================================

export const assignCorpusToAgentSchema = z.object({
  corpus_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  assignment_type: z.enum(['global', 'personal']),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type CreateAgentModelInput = z.infer<typeof createAgentModelSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateCorpusInput = z.infer<typeof createCorpusSchema>;
export type UpdateCorpusInput = z.infer<typeof updateCorpusSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type AssignCorpusInput = z.infer<typeof assignCorpusToAgentSchema>;
