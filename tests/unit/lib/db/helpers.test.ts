/**
 * Unit Tests - Database Helpers
 * Tests user management, audit logging, system settings helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import {
  getUserWithProfile,
  getUsersByRole,
  getUsersByStatus,
  updateUserRole,
  updateUserStatus,
  createAuditLog,
  getAuditLogs,
  getSystemSetting,
  getSystemSettings,
  updateSystemSetting,
  isUserAdmin,
  isUserModerator,
  canManageUsers,
  canManageSettings,
  getAllSystemSettingsGrouped,
  getSystemSettingsByCategory,
  bulkUpdateSystemSettings,
} from '@/lib/db/helpers';

// Mock Prisma Client
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user_roles: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    user_profiles: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    audit_logs: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    system_settings: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Database Helpers - User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserWithProfile', () => {
    it('fetches user role and profile', async () => {
      const mockUserRole = { user_id: 'user-1', role: 'admin', assigned_by: 'admin-1', assigned_at: new Date() };
      const mockUserProfile = { user_id: 'user-1', full_name: 'Test User', status: 'active' };

      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
      vi.mocked(prisma.user_profiles.findUnique).mockResolvedValue(mockUserProfile as any);

      const result = await getUserWithProfile('user-1');

      expect(prisma.user_roles.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
      });

      expect(prisma.user_profiles.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
      });

      expect(result).toEqual({
        ...mockUserRole,
        user_profiles: mockUserProfile,
      });
    });

    it('returns null if user role not found', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user_profiles.findUnique).mockResolvedValue(null);

      const result = await getUserWithProfile('nonexistent-user');

      expect(result).toBeNull();
    });

    it('returns user role with null profile if profile not found', async () => {
      const mockUserRole = { user_id: 'user-1', role: 'user', assigned_by: 'admin-1' };

      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(mockUserRole as any);
      vi.mocked(prisma.user_profiles.findUnique).mockResolvedValue(null);

      const result = await getUserWithProfile('user-1');

      expect(result).toEqual({
        ...mockUserRole,
        user_profiles: null,
      });
    });
  });

  describe('getUsersByRole', () => {
    it('fetches users by role with profiles', async () => {
      const mockUserRoles = [
        { user_id: 'user-1', role: 'admin' },
        { user_id: 'user-2', role: 'admin' },
      ];
      const mockProfiles = [
        { user_id: 'user-1', full_name: 'Admin One' },
        { user_id: 'user-2', full_name: 'Admin Two' },
      ];

      vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockUserRoles as any);
      vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles as any);

      const result = await getUsersByRole('admin');

      expect(prisma.user_roles.findMany).toHaveBeenCalledWith({
        where: { role: 'admin' },
        orderBy: { assigned_at: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockUserRoles[0],
        user_profiles: mockProfiles[0],
      });
    });

    it('handles users without profiles', async () => {
      const mockUserRoles = [{ user_id: 'user-1', role: 'user' }];
      const mockProfiles: any[] = [];

      vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockUserRoles as any);
      vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles);

      const result = await getUsersByRole('user');

      expect(result[0]).toEqual({
        ...mockUserRoles[0],
        user_profiles: null,
      });
    });
  });

  describe('getUsersByStatus', () => {
    it('fetches users by status with roles', async () => {
      const mockProfiles = [
        { user_id: 'user-1', status: 'active', full_name: 'User One' },
        { user_id: 'user-2', status: 'active', full_name: 'User Two' },
      ];
      const mockRoles = [
        { user_id: 'user-1', role: 'admin' },
        { user_id: 'user-2', role: 'user' },
      ];

      vi.mocked(prisma.user_profiles.findMany).mockResolvedValue(mockProfiles as any);
      vi.mocked(prisma.user_roles.findMany).mockResolvedValue(mockRoles as any);

      const result = await getUsersByStatus('active');

      expect(prisma.user_profiles.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        orderBy: { updated_at: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockProfiles[0],
        user_roles: mockRoles[0],
      });
    });
  });

  describe('updateUserRole', () => {
    it('upserts user role', async () => {
      const mockUpdatedRole = { user_id: 'user-1', role: 'moderator', assigned_by: 'admin-1' };

      vi.mocked(prisma.user_roles.upsert).mockResolvedValue(mockUpdatedRole as any);

      const result = await updateUserRole('user-1', 'moderator', 'admin-1');

      expect(prisma.user_roles.upsert).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        update: {
          role: 'moderator',
          assigned_by: 'admin-1',
          updated_at: expect.any(Date),
        },
        create: {
          user_id: 'user-1',
          role: 'moderator',
          assigned_by: 'admin-1',
        },
      });

      expect(result).toEqual(mockUpdatedRole);
    });
  });

  describe('updateUserStatus', () => {
    it('upserts user status', async () => {
      const mockUpdatedProfile = { user_id: 'user-1', status: 'inactive' };

      vi.mocked(prisma.user_profiles.upsert).mockResolvedValue(mockUpdatedProfile as any);

      const result = await updateUserStatus('user-1', 'inactive');

      expect(prisma.user_profiles.upsert).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        update: {
          status: 'inactive',
          updated_at: expect.any(Date),
        },
        create: {
          user_id: 'user-1',
          status: 'inactive',
        },
      });

      expect(result).toEqual(mockUpdatedProfile);
    });
  });
});

describe('Database Helpers - Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('creates audit log entry', async () => {
      const mockLog = {
        id: 'log-1',
        user_id: 'user-1',
        action: 'user.create',
        action_category: 'user',
      };

      vi.mocked(prisma.audit_logs.create).mockResolvedValue(mockLog as any);

      const result = await createAuditLog({
        user_id: 'user-1',
        action: 'user.create',
        category: 'user',
        entity_type: 'user',
        entity_id: 'user-2',
        description: 'Created new user',
        ip_address: '192.168.1.1',
      });

      expect(prisma.audit_logs.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-1',
          action: 'user.create',
          action_category: 'user',
          entity_type: 'user',
          entity_id: 'user-2',
          ip_address: '192.168.1.1',
          metadata: { description: 'Created new user' },
        },
      });

      expect(result).toEqual(mockLog);
    });

    it('creates audit log without description', async () => {
      const mockLog = { id: 'log-2', action: 'user.delete' };

      vi.mocked(prisma.audit_logs.create).mockResolvedValue(mockLog as any);

      await createAuditLog({
        user_id: 'user-1',
        action: 'user.delete',
        category: 'user',
      });

      expect(prisma.audit_logs.create).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('fetches audit logs with default options', async () => {
      const mockLogs = [{ id: 'log-1' }, { id: 'log-2' }];

      vi.mocked(prisma.audit_logs.findMany).mockResolvedValue(mockLogs as any);

      const result = await getAuditLogs();

      expect(prisma.audit_logs.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { created_at: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockLogs);
    });

    it('fetches audit logs filtered by userId', async () => {
      const mockLogs = [{ id: 'log-1', user_id: 'user-1' }];

      vi.mocked(prisma.audit_logs.findMany).mockResolvedValue(mockLogs as any);

      await getAuditLogs({ userId: 'user-1' });

      expect(prisma.audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
        })
      );
    });

    it('fetches audit logs with pagination', async () => {
      vi.mocked(prisma.audit_logs.findMany).mockResolvedValue([]);

      await getAuditLogs({ limit: 20, offset: 10 });

      expect(prisma.audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 10,
        })
      );
    });
  });
});

describe('Database Helpers - System Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemSetting', () => {
    it('fetches single system setting', async () => {
      const mockSetting = { key: 'site_name', value: 'My Site', category: 'general' };

      vi.mocked(prisma.system_settings.findUnique).mockResolvedValue(mockSetting as any);

      const result = await getSystemSetting('site_name');

      expect(prisma.system_settings.findUnique).toHaveBeenCalledWith({
        where: { key: 'site_name' },
      });

      expect(result).toEqual(mockSetting);
    });
  });

  describe('getSystemSettings', () => {
    it('fetches all system settings', async () => {
      const mockSettings = [
        { key: 'site_name', value: 'My Site' },
        { key: 'admin_email', value: 'admin@example.com' },
      ];

      vi.mocked(prisma.system_settings.findMany).mockResolvedValue(mockSettings as any);

      const result = await getSystemSettings();

      expect(prisma.system_settings.findMany).toHaveBeenCalledWith({
        orderBy: { key: 'asc' },
      });

      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateSystemSetting', () => {
    it('updates system setting', async () => {
      const mockUpdated = { key: 'site_name', value: 'New Site Name', updated_by: 'admin-1' };

      vi.mocked(prisma.system_settings.update).mockResolvedValue(mockUpdated as any);

      const result = await updateSystemSetting('site_name', 'New Site Name', 'admin-1');

      expect(prisma.system_settings.update).toHaveBeenCalledWith({
        where: { key: 'site_name' },
        data: {
          value: 'New Site Name',
          updated_by: 'admin-1',
          updated_at: expect.any(Date),
        },
      });

      expect(result).toEqual(mockUpdated);
    });
  });

  describe('getAllSystemSettingsGrouped', () => {
    it('groups settings by category', async () => {
      const mockSettings = [
        { key: 'site_name', category: 'general' },
        { key: 'admin_email', category: 'general' },
        { key: 'smtp_host', category: 'email' },
      ];

      vi.mocked(prisma.system_settings.findMany).mockResolvedValue(mockSettings as any);

      const result = await getAllSystemSettingsGrouped();

      expect(result).toHaveProperty('general');
      expect(result).toHaveProperty('email');
      expect(result.general).toHaveLength(2);
      expect(result.email).toHaveLength(1);
    });
  });

  describe('getSystemSettingsByCategory', () => {
    it('fetches settings by category', async () => {
      const mockSettings = [{ key: 'smtp_host', category: 'email' }];

      vi.mocked(prisma.system_settings.findMany).mockResolvedValue(mockSettings as any);

      const result = await getSystemSettingsByCategory('email');

      expect(prisma.system_settings.findMany).toHaveBeenCalledWith({
        where: { category: 'email' },
        orderBy: { key: 'asc' },
      });

      expect(result).toEqual(mockSettings);
    });
  });

  describe('bulkUpdateSystemSettings', () => {
    it('updates multiple settings in transaction', async () => {
      const updates = [
        { key: 'site_name', value: 'New Name' },
        { key: 'admin_email', value: 'newemail@example.com' },
      ];

      vi.mocked(prisma.$transaction).mockResolvedValue([]);

      await bulkUpdateSystemSettings(updates, 'admin-1');

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});

describe('Database Helpers - Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isUserAdmin', () => {
    it('returns true for admin user', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'admin' } as any);

      const result = await isUserAdmin('user-1');

      expect(result).toBe(true);
    });

    it('returns false for non-admin user', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'user' } as any);

      const result = await isUserAdmin('user-1');

      expect(result).toBe(false);
    });

    it('returns false if user role not found', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue(null);

      const result = await isUserAdmin('nonexistent-user');

      expect(result).toBe(false);
    });
  });

  describe('isUserModerator', () => {
    it('returns true for admin user', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'admin' } as any);

      const result = await isUserModerator('user-1');

      expect(result).toBe(true);
    });

    it('returns true for moderator user', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'moderator' } as any);

      const result = await isUserModerator('user-1');

      expect(result).toBe(true);
    });

    it('returns false for regular user', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'user' } as any);

      const result = await isUserModerator('user-1');

      expect(result).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('returns true for moderators', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'moderator' } as any);

      const result = await canManageUsers('user-1');

      expect(result).toBe(true);
    });

    it('returns false for regular users', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'user' } as any);

      const result = await canManageUsers('user-1');

      expect(result).toBe(false);
    });
  });

  describe('canManageSettings', () => {
    it('returns true for admins', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'admin' } as any);

      const result = await canManageSettings('user-1');

      expect(result).toBe(true);
    });

    it('returns false for non-admins', async () => {
      vi.mocked(prisma.user_roles.findUnique).mockResolvedValue({ role: 'moderator' } as any);

      const result = await canManageSettings('user-1');

      expect(result).toBe(false);
    });
  });
});
