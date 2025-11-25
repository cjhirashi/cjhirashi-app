/**
 * Integration Tests - Admin Agents API
 * Tests: GET /api/admin/agents, POST /api/admin/agents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/agents/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth', () => ({
  requireApiRole: vi.fn().mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    agents: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const { requireApiRole } = await import('@/lib/api/auth');
const { prisma } = await import('@/lib/db/prisma');

describe('Admin Agents API - GET /api/admin/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all agents without filters', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Test Agent 1',
        description: 'Description 1',
        is_active: true,
        agent_models: [],
        created_by_user: { id: 'user-1', email: 'user1@test.com' },
        created_at: new Date('2025-01-01'),
      },
      {
        id: 'agent-2',
        name: 'Test Agent 2',
        description: 'Description 2',
        is_active: false,
        agent_models: [],
        created_by_user: { id: 'user-2', email: 'user2@test.com' },
        created_at: new Date('2025-01-02'),
      },
    ];

    vi.mocked(prisma.agents.findMany).mockResolvedValue(mockAgents as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockAgents);
    expect(requireApiRole).toHaveBeenCalledWith(request, 'moderator');
  });

  it('should filter agents by is_active=true', async () => {
    const mockActiveAgents = [
      {
        id: 'agent-1',
        name: 'Active Agent',
        is_active: true,
        agent_models: [],
        created_by_user: { id: 'user-1', email: 'user1@test.com' },
        created_at: new Date('2025-01-01'),
      },
    ];

    vi.mocked(prisma.agents.findMany).mockResolvedValue(mockActiveAgents as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents?is_active=true');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockActiveAgents);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { is_active: true },
      })
    );
  });

  it('should filter agents by project_type', async () => {
    const mockProjectAgents = [
      {
        id: 'agent-3',
        name: 'Project Agent',
        project_type: 'web-app',
        agent_models: [],
        created_by_user: { id: 'user-1', email: 'user1@test.com' },
        created_at: new Date('2025-01-01'),
      },
    ];

    vi.mocked(prisma.agents.findMany).mockResolvedValue(mockProjectAgents as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents?project_type=web-app');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.agents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { project_type: 'web-app' },
      })
    );
  });

  it('should return 500 if requireApiRole throws authentication error', async () => {
    vi.mocked(requireApiRole).mockRejectedValue(new Error('Authentication required'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 500 if database query fails', async () => {
    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.agents.findMany).mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database connection failed');
  });
});

describe('Admin Agents API - POST /api/admin/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new agent with valid data', async () => {
    const validAgentData = {
      name: 'New Test Agent',
      description: 'Agent for testing',
      specialization: 'Testing',
      has_project_capability: true,
      project_type: 'test-project',
      allows_global_corpus: true,
      allows_personal_corpus: false,
      is_active: true,
    };

    const mockCreatedAgent = {
      id: 'new-agent-id',
      ...validAgentData,
      created_by: 'admin-user-id',
      agent_models: [],
      created_at: new Date('2025-01-15'),
    };

    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.agents.create).mockResolvedValue(mockCreatedAgent as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents', {
      method: 'POST',
      body: JSON.stringify(validAgentData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockCreatedAgent);
    expect(data.message).toBe('Agent created successfully');
    expect(requireApiRole).toHaveBeenCalledWith(request, 'admin');
    expect(prisma.agents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ...validAgentData,
          created_by: 'admin-user-id',
        }),
      })
    );
  });

  it('should create agent with minimal required fields', async () => {
    const minimalData = {
      name: 'Minimal Agent',
    };

    const mockCreatedAgent = {
      id: 'minimal-agent-id',
      name: 'Minimal Agent',
      created_by: 'admin-user-id',
      agent_models: [],
      is_active: true,
      created_at: new Date('2025-01-15'),
    };

    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.agents.create).mockResolvedValue(mockCreatedAgent as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents', {
      method: 'POST',
      body: JSON.stringify(minimalData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Minimal Agent');
  });

  it('should return 500 if validation fails (invalid schema)', async () => {
    const invalidData = {
      name: '', // Invalid: empty string
    };

    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(prisma.agents.create).not.toHaveBeenCalled();
  });

  it('should return 500 if requireApiRole throws insufficient permissions error', async () => {
    vi.mocked(requireApiRole).mockRejectedValue(new Error('Insufficient permissions. Required: admin'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Agent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Insufficient permissions');
    expect(prisma.agents.create).not.toHaveBeenCalled();
  });

  it('should return 500 if database insert fails', async () => {
    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.agents.create).mockRejectedValue(new Error('Database constraint violation'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Agent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database constraint violation');
  });
});
