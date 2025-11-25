/**
 * Integration Tests - Admin Users API (by ID)
 * Tests: GET /api/admin/users/[id], PATCH /api/admin/users/[id], DELETE /api/admin/users/[id]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/admin/users/[id]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'admin-id', email: 'admin@test.com' }),
  requirePermission: vi.fn().mockResolvedValue(undefined),
  Permission: {
    VIEW_USERS: 'view:users',
    EDIT_USERS: 'edit:users',
    DELETE_USERS: 'delete:users',
    MANAGE_USER_ROLES: 'manage:user_roles',
  },
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user_roles: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    users: {
      findUnique: vi.fn(),
    },
    user_profiles: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/helpers', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  updateUserStatus: vi.fn().mockResolvedValue(undefined),
}));

const { requirePermission, getCurrentUser } = await import('@/lib/auth/server');
const { prisma } = await import('@/lib/db/prisma');
const { createAuditLog, updateUserRole, updateUserStatus } = await import('@/lib/db/helpers');

describe('Admin Users API - GET /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user details', async () => {
    const mockUserRole = { user_id: 'user-123', role: 'user' };
    const mockUser = { id: 'user-123', email: 'test@test.com', created_at: new Date('2025-01-01') };
    const mockProfile = {
      user_id: 'user-123',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      status: 'active',
      last_login_at: new Date('2025-01-15'),
    };

    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
    vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user_profiles.findUnique).mockResolvedValue(mockProfile as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123');
    const params = Promise.resolve({ id: 'user-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe('user-123');
    expect(data.user.email).toBe('test@test.com');
    expect(data.user.fullName).toBe('Test User');
    expect(data.user.role).toBe('user');
    expect(data.user.status).toBe('active');
    expect(requirePermission).toHaveBeenCalled();
  });

  it('should return 404 if user not found', async () => {
    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent');
    const params = Promise.resolve({ id: 'nonexistent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain('Usuario no encontrado');
  });

  it('should return 403 if user lacks VIEW_USERS permission', async () => {
    vi.mocked(requirePermission).mockRejectedValue(new Error('Permission denied'));

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123');
    const params = Promise.resolve({ id: 'user-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toContain('No tienes permiso');
  });
});

describe('Admin Users API - PATCH /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue(undefined);
  });

  it('should update user profile fields', async () => {
    const mockUserRole = { user_id: 'user-123', role: 'user' };
    const mockUser = { id: 'user-123', email: 'test@test.com' };

    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
    vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user_profiles.update).mockResolvedValue({} as any);

    const updateData = {
      fullName: 'Updated Name',
      avatarUrl: 'https://example.com/new-avatar.jpg',
    };

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('actualizado exitosamente');
    expect(prisma.user_profiles.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'user-123' },
        data: expect.objectContaining({
          full_name: 'Updated Name',
          avatar_url: 'https://example.com/new-avatar.jpg',
        }),
      })
    );
    expect(createAuditLog).toHaveBeenCalled();
  });

  it('should update user role if user has MANAGE_USER_ROLES permission', async () => {
    const mockUserRole = { user_id: 'user-123', role: 'user' };
    const mockUser = { id: 'user-123', email: 'test@test.com' };

    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
    vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);

    const updateData = { role: 'moderator' };

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updateUserRole).toHaveBeenCalledWith('user-123', 'moderator', 'admin-id');
    expect(createAuditLog).toHaveBeenCalled();
  });

  it('should prevent admin from removing their own admin role', async () => {
    const mockUserRole = { user_id: 'admin-id', role: 'admin' };
    const mockUser = { id: 'admin-id', email: 'admin@test.com' };

    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
    vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);

    const updateData = { role: 'user' };

    const request = new NextRequest('http://localhost:3000/api/admin/users/admin-id', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    const params = Promise.resolve({ id: 'admin-id' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('No puedes eliminar tu propio rol');
    expect(updateUserRole).not.toHaveBeenCalled();
  });

  it('should return 404 if user not found', async () => {
    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ fullName: 'Test' }),
    });

    const params = Promise.resolve({ id: 'nonexistent' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain('Usuario no encontrado');
  });

  it('should return 403 if user lacks permissions', async () => {
    vi.mocked(requirePermission).mockRejectedValue(new Error('Permission denied'));

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
      method: 'PATCH',
      body: JSON.stringify({ fullName: 'Test' }),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toContain('No tienes permiso');
  });
});

describe('Admin Users API - DELETE /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue(undefined);
  });

  it('should delete user successfully', async () => {
    const mockUserRole = { user_id: 'user-123', role: 'user' };
    const mockUser = { id: 'user-123', email: 'test@test.com' };

    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
    vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user_profiles.delete).mockResolvedValue({} as any);
    vi.mocked(prisma.user_roles.delete).mockResolvedValue(mockUserRole as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('eliminado exitosamente');
    expect(prisma.user_roles.delete).toHaveBeenCalledWith({
      where: { user_id: 'user-123' },
    });
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.deleted',
      })
    );
  });

  it('should prevent user from deleting themselves', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/users/admin-id', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'admin-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('No puedes eliminarte a ti mismo');
    expect(prisma.user_roles.delete).not.toHaveBeenCalled();
  });

  it('should return 404 if user not found', async () => {
    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'nonexistent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain('Usuario no encontrado');
  });

  it('should return 403 if user lacks DELETE_USERS permission', async () => {
    vi.mocked(requirePermission).mockRejectedValue(new Error('Permission denied'));

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toContain('No tienes permiso');
  });

  it('should handle missing profile gracefully', async () => {
    const mockUserRole = { user_id: 'user-123', role: 'user' };
    const mockUser = { id: 'user-123', email: 'test@test.com' };

    vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
    vi.mocked(prisma.users.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user_profiles.delete).mockRejectedValue(new Error('Profile not found'));
    vi.mocked(prisma.user_roles.delete).mockResolvedValue(mockUserRole as any);

    const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: 'user-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user_roles.delete).toHaveBeenCalled();
  });
});
