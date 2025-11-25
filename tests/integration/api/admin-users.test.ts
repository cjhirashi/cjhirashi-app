/**
 * Integration Tests - Admin Users API
 * Tests: GET /api/admin/users, POST /api/admin/users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/users/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'admin-id', email: 'admin@test.com' }),
  requirePermission: vi.fn().mockResolvedValue(undefined),
  Permission: {
    VIEW_USERS: 'view:users',
    CREATE_USERS: 'create:users',
  },
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user_roles: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    users: {
      findMany: vi.fn(),
    },
    user_profiles: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/helpers', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  updateUserStatus: vi.fn().mockResolvedValue(undefined),
}));

const { requirePermission } = await import('@/lib/auth/server');
const { prisma } = await import('@/lib/db/prisma');
const { createAuditLog, updateUserRole, updateUserStatus } = await import('@/lib/db/helpers');

describe('Admin Users API - GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list users with default pagination', async () => {
    const mockUserRoles = [
      { user_id: 'user-1', role: 'admin', updated_at: new Date('2025-01-01') },
      { user_id: 'user-2', role: 'user', updated_at: new Date('2025-01-02') },
    ];

    const mockUsers = [
      { id: 'user-1', email: 'user1@test.com', created_at: new Date('2025-01-01') },
      { id: 'user-2', email: 'user2@test.com', created_at: new Date('2025-01-02') },
    ];

    const mockProfiles = [
      { user_id: 'user-1', full_name: 'User One', status: 'active', avatar_url: null, last_login_at: null },
      { user_id: 'user-2', full_name: 'User Two', status: 'active', avatar_url: null, last_login_at: null },
    ];

    vi.mocked(prisma.user_roles.count).mockResolvedValue(2);
    vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockUserRoles as any);
    vi.mocked(prisma.users.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(10);
    expect(requirePermission).toHaveBeenCalled();
  });

  it('should filter users by role', async () => {
    const mockAdminRole = [
      { user_id: 'admin-1', role: 'admin', updated_at: new Date('2025-01-01') },
    ];

    const mockUsers = [
      { id: 'admin-1', email: 'admin@test.com', created_at: new Date('2025-01-01') },
    ];

    const mockProfiles = [
      { user_id: 'admin-1', full_name: 'Admin User', status: 'active', avatar_url: null, last_login_at: null },
    ];

    vi.mocked(prisma.user_roles.count).mockResolvedValue(1);
    vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockAdminRole as any);
    vi.mocked(prisma.users.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users?role=admin');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].role).toBe('admin');
    expect(prisma.user_roles.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'admin' },
      })
    );
  });

  it('should filter users by status', async () => {
    const mockUserRoles = [
      { user_id: 'user-1', role: 'user', updated_at: new Date('2025-01-01') },
      { user_id: 'user-2', role: 'user', updated_at: new Date('2025-01-02') },
    ];

    const mockUsers = [
      { id: 'user-1', email: 'user1@test.com', created_at: new Date('2025-01-01') },
      { id: 'user-2', email: 'user2@test.com', created_at: new Date('2025-01-02') },
    ];

    const mockProfiles = [
      { user_id: 'user-1', full_name: 'Active User', status: 'active', avatar_url: null, last_login_at: null },
      { user_id: 'user-2', full_name: 'Suspended User', status: 'suspended', avatar_url: null, last_login_at: null },
    ];

    vi.mocked(prisma.user_roles.count).mockResolvedValue(2);
    vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockUserRoles as any);
    vi.mocked(prisma.users.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users?status=active');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].status).toBe('active');
  });

  it('should search users by email or name', async () => {
    const mockUserRoles = [
      { user_id: 'user-1', role: 'user', updated_at: new Date('2025-01-01') },
      { user_id: 'user-2', role: 'user', updated_at: new Date('2025-01-02') },
    ];

    const mockUsers = [
      { id: 'user-1', email: 'john@test.com', created_at: new Date('2025-01-01') },
      { id: 'user-2', email: 'jane@test.com', created_at: new Date('2025-01-02') },
    ];

    const mockProfiles = [
      { user_id: 'user-1', full_name: 'John Doe', status: 'active', avatar_url: null, last_login_at: null },
      { user_id: 'user-2', full_name: 'Jane Smith', status: 'active', avatar_url: null, last_login_at: null },
    ];

    vi.mocked(prisma.user_roles.count).mockResolvedValue(2);
    vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockUserRoles as any);
    vi.mocked(prisma.users.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users?search=john');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].fullName).toBe('John Doe');
  });

  it('should paginate results correctly', async () => {
    const mockUserRoles = [
      { user_id: 'user-11', role: 'user', updated_at: new Date('2025-01-11') },
      { user_id: 'user-12', role: 'user', updated_at: new Date('2025-01-12') },
    ];

    const mockUsers = [
      { id: 'user-11', email: 'user11@test.com', created_at: new Date('2025-01-11') },
      { id: 'user-12', email: 'user12@test.com', created_at: new Date('2025-01-12') },
    ];

    const mockProfiles = [
      { user_id: 'user-11', full_name: 'User 11', status: 'active', avatar_url: null, last_login_at: null },
      { user_id: 'user-12', full_name: 'User 12', status: 'active', avatar_url: null, last_login_at: null },
    ];

    vi.mocked(prisma.user_roles.count).mockResolvedValue(25);
    vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockUserRoles as any);
    vi.mocked(prisma.users.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users?page=2&pageSize=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.pageSize).toBe(10);
    expect(data.total).toBe(25);
    expect(prisma.user_roles.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it('should return 403 if user lacks VIEW_USERS permission', async () => {
    vi.mocked(requirePermission).mockRejectedValue(new Error('Permission denied'));

    const request = new NextRequest('http://localhost:3000/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toContain('No tienes permiso');
  });
});

describe('Admin Users API - POST /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new user with valid data', async () => {
    const newUserData = {
      email: 'newuser@test.com',
      fullName: 'New User',
      role: 'user',
      status: 'active',
    };

    vi.mocked(updateUserRole).mockResolvedValue(undefined);
    vi.mocked(updateUserStatus).mockResolvedValue(undefined);
    vi.mocked(prisma.user_profiles.update).mockResolvedValue({} as any);
    vi.mocked(createAuditLog).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUserData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.email).toBe('newuser@test.com');
    expect(data.user.role).toBe('user');
    expect(data.user.status).toBe('active');
    expect(updateUserRole).toHaveBeenCalledWith('newuser@test.com', 'user', 'admin-id');
    expect(updateUserStatus).toHaveBeenCalledWith('newuser@test.com', 'active');
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.created',
        category: 'user',
        entity_type: 'user',
      })
    );
  });

  it('should return 400 if email is invalid', async () => {
    const invalidData = {
      email: 'invalid-email',
      fullName: 'Test User',
      role: 'user',
      status: 'active',
    };

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('Email inválido');
    expect(updateUserRole).not.toHaveBeenCalled();
  });

  it('should return 400 if role is invalid', async () => {
    const invalidData = {
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'superadmin',
      status: 'active',
    };

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('Rol inválido');
    expect(updateUserRole).not.toHaveBeenCalled();
  });

  it('should return 400 if status is invalid', async () => {
    const invalidData = {
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'user',
      status: 'deleted',
    };

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('Estado inválido');
    expect(updateUserRole).not.toHaveBeenCalled();
  });

  it('should return 403 if user lacks CREATE_USERS permission', async () => {
    vi.mocked(requirePermission).mockRejectedValue(new Error('Permission denied'));

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        role: 'user',
        status: 'active',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toContain('No tienes permiso');
    expect(updateUserRole).not.toHaveBeenCalled();
  });

  it('should return 500 if database operation fails', async () => {
    vi.mocked(updateUserRole).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        fullName: 'Test User',
        role: 'user',
        status: 'active',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain('Error al crear usuario');
  });
});
