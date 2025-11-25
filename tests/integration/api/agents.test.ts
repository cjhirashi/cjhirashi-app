/**
 * Integration Tests - Agents API (Public/User)
 * Tests: GET /api/agents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/agents/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-id', email: 'user@test.com' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    agents: {
      findMany: vi.fn(),
    },
  },
}));

const { requireAuth } = await import('@/lib/api/auth');
const { prisma } = await import('@/lib/db/prisma');

describe('Agents API - GET /api/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all active agents', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Agent A',
        description: 'Description A',
        specialization: 'Spec A',
        has_project_capability: true,
        project_type: 'web-app',
        allows_global_corpus: true,
        allows_personal_corpus: false,
        capabilities: {},
        agent_models: [
          { id: 'model-1', tier: 'economy', model_provider: 'openai', model_name: 'gpt-3.5-turbo', temperature: 0.7, max_tokens: 1000 },
        ],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      },
      {
        id: 'agent-2',
        name: 'Agent B',
        description: 'Description B',
        specialization: 'Spec B',
        has_project_capability: false,
        project_type: null,
        allows_global_corpus: false,
        allows_personal_corpus: true,
        capabilities: {},
        agent_models: [],
        created_at: new Date('2025-01-02'),
        updated_at: new Date('2025-01-02'),
      },
    ];

    vi.mocked(prisma.agents.findMany).mockResolvedValue(mockAgents as any);

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockAgents);
    expect(requireAuth).toHaveBeenCalled();
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true,
        }),
      })
    );
  });

  it('should filter agents by has_project_capability=true', async () => {
    const mockProjectAgents = [
      {
        id: 'agent-1',
        name: 'Project Agent',
        has_project_capability: true,
        agent_models: [],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      },
    ];

    vi.mocked(prisma.agents.findMany).mockResolvedValue(mockProjectAgents as any);

    const request = new NextRequest('http://localhost:3000/api/agents?has_project_capability=true');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true,
          has_project_capability: true,
        }),
      })
    );
  });

  it('should filter agents by project_type', async () => {
    const mockWebAgents = [
      {
        id: 'agent-web',
        name: 'Web Agent',
        project_type: 'web-app',
        agent_models: [],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      },
    ];

    vi.mocked(prisma.agents.findMany).mockResolvedValue(mockWebAgents as any);

    const request = new NextRequest('http://localhost:3000/api/agents?project_type=web-app');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true,
          project_type: 'web-app',
        }),
      })
    );
  });

  it('should combine multiple filters', async () => {
    vi.mocked(prisma.agents.findMany).mockResolvedValue([] as any);

    const request = new NextRequest('http://localhost:3000/api/agents?has_project_capability=true&project_type=mobile-app');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true,
          has_project_capability: true,
          project_type: 'mobile-app',
        }),
      })
    );
  });

  it('should order results by has_project_capability desc, then name asc', async () => {
    vi.mocked(prisma.agents.findMany).mockResolvedValue([] as any);

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { has_project_capability: 'desc' },
          { name: 'asc' },
        ],
      })
    );
  });

  it('should return 500 if authentication fails', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Authentication required'));

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
    expect(prisma.agents.findMany).not.toHaveBeenCalled();
  });

  it('should return 500 if database query fails', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-id', email: 'user@test.com' } as any);
    vi.mocked(prisma.agents.findMany).mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database connection failed');
  });

  it('should exclude inactive agents from results', async () => {
    vi.mocked(prisma.agents.findMany).mockResolvedValue([] as any);

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true, // CRITICAL: only active agents
        }),
      })
    );
  });

  it('should return agent models with tier ordering', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Multi-Model Agent',
        agent_models: [
          { id: 'model-1', tier: 'economy', model_name: 'gpt-3.5-turbo' },
          { id: 'model-2', tier: 'balanced', model_name: 'gpt-4-mini' },
          { id: 'model-3', tier: 'premium', model_name: 'gpt-4' },
        ],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      },
    ];

    vi.mocked(prisma.agents.findMany).mockResolvedValue(mockAgents as any);

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          agent_models: expect.objectContaining({
            orderBy: { tier: 'asc' },
          }),
        }),
      })
    );
  });
});
