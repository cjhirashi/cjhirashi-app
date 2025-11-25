/**
 * Integration Tests - Projects API (User)
 * Tests: GET /api/projects, POST /api/projects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/projects/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-id', email: 'user@test.com' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    projects: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    agents: {
      findFirst: vi.fn(),
    },
  },
}));

const { requireAuth } = await import('@/lib/api/auth');
const { prisma } = await import('@/lib/db/prisma');

describe('Projects API - GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all user projects', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Project A',
        description: 'Description A',
        user_id: 'user-id',
        agent_id: 'agent-1',
        status: 'active',
        project_type: 'web-app',
        agent: { id: 'agent-1', name: 'Agent A', specialization: 'Web Dev', project_type: 'web-app' },
        conversations: [
          { id: 'conv-1', title: 'Conv 1', updated_at: new Date('2025-01-15') },
        ],
        corpora: [
          { id: 'corpus-1', name: 'Corpus A', corpus_type: 'personal' },
        ],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-15'),
      },
      {
        id: 'project-2',
        name: 'Project B',
        description: 'Description B',
        user_id: 'user-id',
        agent_id: 'agent-2',
        status: 'archived',
        project_type: 'mobile-app',
        agent: { id: 'agent-2', name: 'Agent B', specialization: 'Mobile', project_type: 'mobile-app' },
        conversations: [],
        corpora: [],
        created_at: new Date('2025-01-05'),
        updated_at: new Date('2025-01-10'),
      },
    ];

    vi.mocked(prisma.projects.findMany).mockResolvedValue(mockProjects as any);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockProjects);
    expect(requireAuth).toHaveBeenCalled();
    expect(prisma.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id: 'user-id',
        }),
      })
    );
  });

  it('should filter projects by status', async () => {
    const mockActiveProjects = [
      {
        id: 'project-1',
        name: 'Active Project',
        user_id: 'user-id',
        status: 'active',
        agent: { id: 'agent-1', name: 'Agent A', specialization: 'Spec A', project_type: 'web-app' },
        conversations: [],
        corpora: [],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-15'),
      },
    ];

    vi.mocked(prisma.projects.findMany).mockResolvedValue(mockActiveProjects as any);

    const request = new NextRequest('http://localhost:3000/api/projects?status=active');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id: 'user-id',
          status: 'active',
        }),
      })
    );
  });

  it('should filter projects by agent_id', async () => {
    const mockAgentProjects = [
      {
        id: 'project-1',
        name: 'Project with Agent 1',
        user_id: 'user-id',
        agent_id: 'agent-1',
        status: 'active',
        agent: { id: 'agent-1', name: 'Agent A', specialization: 'Spec A', project_type: 'web-app' },
        conversations: [],
        corpora: [],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-15'),
      },
    ];

    vi.mocked(prisma.projects.findMany).mockResolvedValue(mockAgentProjects as any);

    const request = new NextRequest('http://localhost:3000/api/projects?agent_id=agent-1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id: 'user-id',
          agent_id: 'agent-1',
        }),
      })
    );
  });

  it('should order projects by updated_at desc', async () => {
    vi.mocked(prisma.projects.findMany).mockResolvedValue([] as any);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updated_at: 'desc' },
      })
    );
  });

  it('should include agent details in results', async () => {
    vi.mocked(prisma.projects.findMany).mockResolvedValue([] as any);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          agent: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              specialization: true,
              project_type: true,
            }),
          }),
        }),
      })
    );
  });

  it('should include recent conversations (max 3)', async () => {
    vi.mocked(prisma.projects.findMany).mockResolvedValue([] as any);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          conversations: expect.objectContaining({
            take: 3,
            orderBy: { updated_at: 'desc' },
          }),
        }),
      })
    );
  });

  it('should include only active corpora', async () => {
    vi.mocked(prisma.projects.findMany).mockResolvedValue([] as any);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          corpora: expect.objectContaining({
            where: { is_active: true },
          }),
        }),
      })
    );
  });

  it('should return 500 if authentication fails', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Authentication required'));

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
    expect(prisma.projects.findMany).not.toHaveBeenCalled();
  });
});

describe('Projects API - POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new project with valid data', async () => {
    const validProjectData = {
      agent_id: 'agent-1',
      name: 'New Project',
      description: 'Project description',
      project_type: 'web-app',
      status: 'active',
    };

    const mockAgent = {
      id: 'agent-1',
      name: 'Agent A',
      is_active: true,
      project_type: 'web-app',
    };

    const mockCreatedProject = {
      id: 'new-project-id',
      ...validProjectData,
      user_id: 'user-id',
      agent: { id: 'agent-1', name: 'Agent A', specialization: 'Web Dev' },
      created_at: new Date('2025-01-15'),
      updated_at: new Date('2025-01-15'),
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-id', email: 'user@test.com' } as any);
    vi.mocked(prisma.agents.findFirst).mockResolvedValue(mockAgent as any);
    vi.mocked(prisma.projects.create).mockResolvedValue(mockCreatedProject as any);

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify(validProjectData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockCreatedProject);
    expect(data.message).toBe('Project created successfully');
    expect(requireAuth).toHaveBeenCalled();
    expect(prisma.agents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'agent-1', is_active: true },
      })
    );
    expect(prisma.projects.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ...validProjectData,
          user_id: 'user-id',
        }),
      })
    );
  });

  it('should inherit project_type from agent if not specified', async () => {
    const minimalData = {
      agent_id: 'agent-1',
      name: 'Minimal Project',
    };

    const mockAgent = {
      id: 'agent-1',
      name: 'Agent A',
      is_active: true,
      project_type: 'inherited-type',
    };

    const mockCreatedProject = {
      id: 'new-project-id',
      agent_id: 'agent-1',
      name: 'Minimal Project',
      user_id: 'user-id',
      project_type: 'inherited-type',
      agent: { id: 'agent-1', name: 'Agent A', specialization: 'Spec A' },
      created_at: new Date('2025-01-15'),
    };

    vi.mocked(prisma.agents.findFirst).mockResolvedValue(mockAgent as any);
    vi.mocked(prisma.projects.create).mockResolvedValue(mockCreatedProject as any);

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify(minimalData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(prisma.projects.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          project_type: 'inherited-type',
        }),
      })
    );
  });

  it('should return 500 if agent not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-id', email: 'user@test.com' } as any);
    vi.mocked(prisma.agents.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: 'nonexistent-agent',
        name: 'Test Project',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Agent not found or inactive');
    expect(prisma.projects.create).not.toHaveBeenCalled();
  });

  it('should return 500 if agent is inactive', async () => {
    const inactiveAgent = {
      id: 'agent-1',
      name: 'Inactive Agent',
      is_active: false,
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-id', email: 'user@test.com' } as any);
    vi.mocked(prisma.agents.findFirst).mockResolvedValue(null); // findFirst returns null because is_active: true filter

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: 'agent-1',
        name: 'Test Project',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Agent not found or inactive');
    expect(prisma.projects.create).not.toHaveBeenCalled();
  });

  it('should return 500 if validation fails', async () => {
    const invalidData = {
      agent_id: 'not-a-uuid',
      name: '',
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-id', email: 'user@test.com' } as any);

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(prisma.agents.findFirst).not.toHaveBeenCalled();
    expect(prisma.projects.create).not.toHaveBeenCalled();
  });

  it('should return 500 if authentication fails', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Authentication required'));

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: 'agent-1',
        name: 'Test Project',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
    expect(prisma.projects.create).not.toHaveBeenCalled();
  });

  it('should return 500 if database create fails', async () => {
    const mockAgent = {
      id: 'agent-1',
      name: 'Agent A',
      is_active: true,
      project_type: 'web-app',
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-id', email: 'user@test.com' } as any);
    vi.mocked(prisma.agents.findFirst).mockResolvedValue(mockAgent as any);
    vi.mocked(prisma.projects.create).mockRejectedValue(new Error('Database constraint violation'));

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: 'agent-1',
        name: 'Test Project',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database constraint violation');
  });
});
