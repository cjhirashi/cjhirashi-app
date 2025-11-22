/**
 * Database types for application entities
 */

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  specialization: string | null;
  has_project_capability: boolean;
  project_type: string | null;
  allows_global_corpus: boolean;
  allows_personal_corpus: boolean;
  capabilities: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentModel {
  id: string;
  agent_id: string;
  tier: 'economy' | 'balanced' | 'premium';
  model_provider: string;
  model_name: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  agent_id: string;
  name: string;
  description: string | null;
  project_type: string | null;
  structure: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Corpus {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  corpus_type: 'global' | 'personal';
  project_id: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  corpus_id: string;
  filename: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string;
  project_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
