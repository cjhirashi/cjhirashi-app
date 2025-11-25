/**
 * Integration Tests - Admin Agents API (by ID)
 * Tests: GET /api/admin/agents/[id], PUT /api/admin/agents/[id], DELETE /api/admin/agents/[id]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/admin/agents/[id]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth', () => ({
  requireApiRole: vi.fn().mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    agents: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projects: {
      count: vi.fn(),
    },
  },
}));

const { requireApiRole } = await import('@/lib/api/auth');
const { prisma } = await import('@/lib/db/prisma');

describe('Admin Agents API - GET /api/admin/agents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return agent details with all relationships', async () => {
    const mockAgent = {
      id: 'agent-123',
      name: 'Test Agent',
      description: 'Test Description',
      is_active: true,
      agent_models: [
        { id: 'model-1', tier: 'economy', model_name: 'gpt-3.5-turbo' },
        { id: 'model-2', tier: 'premium', model_name: 'gpt-4' },
      ],
      created_by_user: { id: 'user-1', email: 'creator@test.com' },
      projects: [
        { id: 'project-1', name: 'Project A', user_id: 'user-1' },
      ],
      agent_corpus_assignments: [
        {
          id: 'assignment-1',
          corpus: { id: 'corpus-1', name: 'Corpus A', corpus_type: 'global' },
        },
      ],
      created_at: new Date('2025-01-01'),
    };

    vi.mocked(prisma.agents.findUnique).mockResolvedValue(mockAgent as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123');
    const params = Promise.resolve({ id: 'agent-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockAgent);
    expect(requireApiRole).toHaveBeenCalledWith(request, 'moderator');
    expect(prisma.agents.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'agent-123' },
      })
    );
  });

  it('should return 404 if agent not found', async () => {
    vi.mocked(prisma.agents.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/agents/nonexistent-id');
    const params = Promise.resolve({ id: 'nonexistent-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Agent not found');
  });

  it('should return 500 if authentication fails', async () => {
    vi.mocked(requireApiRole).mockRejectedValue(new Error('Authentication required'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123');
    const params = Promise.resolve({ id: 'agent-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
  });
});

describe('Admin Agents API - PUT /api/admin/agents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update agent with valid data', async () => {
    const updateData = {
      name: 'Updated Agent Name',
      description: 'Updated Description',
      is_active: false,
    };

    const mockUpdatedAgent = {
      id: 'agent-123',
      ...updateData,
      agent_models: [],
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-15'),
    };

    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.agents.update).mockResolvedValue(mockUpdatedAgent as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockUpdatedAgent);
    expect(data.message).toBe('Agent updated successfully');
    expect(requireApiRole).toHaveBeenCalledWith(request, 'admin');
    expect(prisma.agents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'agent-123' },
        data: updateData,
      })
    );
  });

  it('should update only specified fields (partial update)', async () => {
    const partialUpdate = {
      is_active: true,
    };

    const mockUpdatedAgent = {
      id: 'agent-123',
      name: 'Existing Name',
      is_active: true,
      agent_models: [],
    };

    vi.mocked(prisma.agents.update).mockResolvedValue(mockUpdatedAgent as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'PUT',
      body: JSON.stringify(partialUpdate),
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.agents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { is_active: true },
      })
    );
  });

  it('should return 500 if validation fails', async () => {
    const invalidData = {
      name: '', // Invalid: empty string
    };

    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(prisma.agents.update).not.toHaveBeenCalled();
  });

  it('should return 500 if user lacks admin role', async () => {
    vi.mocked(requireApiRole).mockRejectedValue(new Error('Insufficient permissions. Required: admin'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Insufficient permissions');
  });
});

describe('Admin Agents API - DELETE /api/admin/agents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete agent if no active projects', async () => {
    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.projects.count).mockResolvedValue(0);
    vi.mocked(prisma.agents.delete).mockResolvedValue({ id: 'agent-123' } as any);

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Agent deleted successfully');
    expect(requireApiRole).toHaveBeenCalledWith(request, 'admin');
    expect(prisma.projects.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { agent_id: 'agent-123', status: 'active' },
      })
    );
    expect(prisma.agents.delete).toHaveBeenCalledWith({
      where: { id: 'agent-123' },
    });
  });

  it('should return 400 if agent has active projects', async () => {
    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.projects.count).mockResolvedValue(5);

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Cannot delete agent with active projects');
    expect(data.details).toEqual({ activeProjects: 5 });
    expect(prisma.agents.delete).not.toHaveBeenCalled();
  });

  it('should return 500 if user lacks admin role', async () => {
    vi.mocked(requireApiRole).mockRejectedValue(new Error('Insufficient permissions. Required: admin'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Insufficient permissions');
    expect(prisma.agents.delete).not.toHaveBeenCalled();
  });

  it('should return 500 if database delete fails', async () => {
    vi.mocked(requireApiRole).mockResolvedValue({ id: 'admin-user-id', email: 'admin@test.com' } as any);
    vi.mocked(prisma.projects.count).mockResolvedValue(0);
    vi.mocked(prisma.agents.delete).mockRejectedValue(new Error('Foreign key constraint violation'));

    const request = new NextRequest('http://localhost:3000/api/admin/agents/agent-123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'agent-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Foreign key constraint violation');
  });
});
