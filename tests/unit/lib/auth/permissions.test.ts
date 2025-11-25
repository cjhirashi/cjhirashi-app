import { describe, it, expect } from 'vitest'
import {
  getRolePermissions,
  roleHasPermission,
} from '@/lib/auth/permissions'
import { Permission } from '@/lib/auth/types'

describe('lib/auth/permissions', () => {
  describe('getRolePermissions()', () => {
    it('should return all permissions for admin role', () => {
      const permissions = getRolePermissions('admin')

      expect(permissions).toContain(Permission.VIEW_USERS)
      expect(permissions).toContain(Permission.CREATE_USERS)
      expect(permissions).toContain(Permission.EDIT_USERS)
      expect(permissions).toContain(Permission.DELETE_USERS)
      expect(permissions).toContain(Permission.MANAGE_USER_ROLES)
      expect(permissions).toContain(Permission.VIEW_ROLES)
      expect(permissions).toContain(Permission.EDIT_ROLES)
      expect(permissions).toContain(Permission.VIEW_AUDIT_LOGS)
      expect(permissions).toContain(Permission.VIEW_SETTINGS)
      expect(permissions).toContain(Permission.EDIT_SETTINGS)
      expect(permissions).toContain(Permission.VIEW_DASHBOARD)
      expect(permissions).toContain(Permission.VIEW_ANALYTICS)
      expect(permissions).toContain(Permission.VIEW_CONTENT)
      expect(permissions).toContain(Permission.CREATE_CONTENT)
      expect(permissions).toContain(Permission.EDIT_CONTENT)
      expect(permissions).toContain(Permission.DELETE_CONTENT)

      // Admin should have 16 permissions
      expect(permissions.length).toBe(16)
    })

    it('should return moderator permissions', () => {
      const permissions = getRolePermissions('moderator')

      // Moderator CAN do these:
      expect(permissions).toContain(Permission.VIEW_USERS)
      expect(permissions).toContain(Permission.CREATE_USERS)
      expect(permissions).toContain(Permission.EDIT_USERS)
      expect(permissions).toContain(Permission.VIEW_ROLES)
      expect(permissions).toContain(Permission.VIEW_AUDIT_LOGS)
      expect(permissions).toContain(Permission.VIEW_DASHBOARD)
      expect(permissions).toContain(Permission.VIEW_ANALYTICS)
      expect(permissions).toContain(Permission.VIEW_CONTENT)
      expect(permissions).toContain(Permission.CREATE_CONTENT)
      expect(permissions).toContain(Permission.EDIT_CONTENT)
      expect(permissions).toContain(Permission.DELETE_CONTENT)

      // Moderator CANNOT do these:
      expect(permissions).not.toContain(Permission.DELETE_USERS)
      expect(permissions).not.toContain(Permission.MANAGE_USER_ROLES)
      expect(permissions).not.toContain(Permission.EDIT_ROLES)
      expect(permissions).not.toContain(Permission.VIEW_SETTINGS)
      expect(permissions).not.toContain(Permission.EDIT_SETTINGS)

      // Moderator should have 11 permissions
      expect(permissions.length).toBe(11)
    })

    it('should return minimal permissions for user role', () => {
      const permissions = getRolePermissions('user')

      // User CAN only:
      expect(permissions).toContain(Permission.VIEW_DASHBOARD)

      // User CANNOT do these:
      expect(permissions).not.toContain(Permission.VIEW_USERS)
      expect(permissions).not.toContain(Permission.EDIT_USERS)
      expect(permissions).not.toContain(Permission.DELETE_USERS)
      expect(permissions).not.toContain(Permission.VIEW_SETTINGS)
      expect(permissions).not.toContain(Permission.EDIT_SETTINGS)

      // User should have 1 permission
      expect(permissions.length).toBe(1)
    })

    it('should return an array for any valid role', () => {
      expect(Array.isArray(getRolePermissions('admin'))).toBe(true)
      expect(Array.isArray(getRolePermissions('moderator'))).toBe(true)
      expect(Array.isArray(getRolePermissions('user'))).toBe(true)
    })
  })

  describe('roleHasPermission()', () => {
    describe('Admin role', () => {
      it('should have permission to view users', () => {
        expect(roleHasPermission('admin', Permission.VIEW_USERS)).toBe(true)
      })

      it('should have permission to delete users', () => {
        expect(roleHasPermission('admin', Permission.DELETE_USERS)).toBe(true)
      })

      it('should have permission to manage user roles', () => {
        expect(roleHasPermission('admin', Permission.MANAGE_USER_ROLES)).toBe(true)
      })

      it('should have permission to edit settings', () => {
        expect(roleHasPermission('admin', Permission.EDIT_SETTINGS)).toBe(true)
      })

      it('should have permission to edit roles', () => {
        expect(roleHasPermission('admin', Permission.EDIT_ROLES)).toBe(true)
      })

      it('should have all permissions', () => {
        const allPermissions = Object.values(Permission)
        allPermissions.forEach((permission) => {
          expect(roleHasPermission('admin', permission)).toBe(true)
        })
      })
    })

    describe('Moderator role', () => {
      it('should have permission to view users', () => {
        expect(roleHasPermission('moderator', Permission.VIEW_USERS)).toBe(true)
      })

      it('should have permission to edit users', () => {
        expect(roleHasPermission('moderator', Permission.EDIT_USERS)).toBe(true)
      })

      it('should have permission to view audit logs', () => {
        expect(roleHasPermission('moderator', Permission.VIEW_AUDIT_LOGS)).toBe(true)
      })

      it('should NOT have permission to delete users', () => {
        expect(roleHasPermission('moderator', Permission.DELETE_USERS)).toBe(false)
      })

      it('should NOT have permission to manage user roles', () => {
        expect(roleHasPermission('moderator', Permission.MANAGE_USER_ROLES)).toBe(false)
      })

      it('should NOT have permission to edit settings', () => {
        expect(roleHasPermission('moderator', Permission.EDIT_SETTINGS)).toBe(false)
      })

      it('should NOT have permission to edit roles', () => {
        expect(roleHasPermission('moderator', Permission.EDIT_ROLES)).toBe(false)
      })
    })

    describe('User role', () => {
      it('should have permission to view dashboard', () => {
        expect(roleHasPermission('user', Permission.VIEW_DASHBOARD)).toBe(true)
      })

      it('should NOT have permission to view users', () => {
        expect(roleHasPermission('user', Permission.VIEW_USERS)).toBe(false)
      })

      it('should NOT have permission to edit users', () => {
        expect(roleHasPermission('user', Permission.EDIT_USERS)).toBe(false)
      })

      it('should NOT have permission to delete users', () => {
        expect(roleHasPermission('user', Permission.DELETE_USERS)).toBe(false)
      })

      it('should NOT have permission to view settings', () => {
        expect(roleHasPermission('user', Permission.VIEW_SETTINGS)).toBe(false)
      })

      it('should NOT have permission to edit settings', () => {
        expect(roleHasPermission('user', Permission.EDIT_SETTINGS)).toBe(false)
      })

      it('should NOT have permission to manage user roles', () => {
        expect(roleHasPermission('user', Permission.MANAGE_USER_ROLES)).toBe(false)
      })
    })

    describe('Permission hierarchy validation', () => {
      it('admin should have more permissions than moderator', () => {
        const adminPerms = getRolePermissions('admin')
        const moderatorPerms = getRolePermissions('moderator')

        expect(adminPerms.length).toBeGreaterThan(moderatorPerms.length)

        // All moderator permissions should be in admin permissions
        moderatorPerms.forEach((perm) => {
          expect(adminPerms).toContain(perm)
        })
      })

      it('moderator should have more permissions than user', () => {
        const moderatorPerms = getRolePermissions('moderator')
        const userPerms = getRolePermissions('user')

        expect(moderatorPerms.length).toBeGreaterThan(userPerms.length)

        // All user permissions should be in moderator permissions
        userPerms.forEach((perm) => {
          expect(moderatorPerms).toContain(perm)
        })
      })

      it('admin should have more permissions than user', () => {
        const adminPerms = getRolePermissions('admin')
        const userPerms = getRolePermissions('user')

        expect(adminPerms.length).toBeGreaterThan(userPerms.length)

        // All user permissions should be in admin permissions
        userPerms.forEach((perm) => {
          expect(adminPerms).toContain(perm)
        })
      })
    })
  })

  describe('Critical permissions boundaries', () => {
    it('only admin can manage user roles', () => {
      expect(roleHasPermission('admin', Permission.MANAGE_USER_ROLES)).toBe(true)
      expect(roleHasPermission('moderator', Permission.MANAGE_USER_ROLES)).toBe(false)
      expect(roleHasPermission('user', Permission.MANAGE_USER_ROLES)).toBe(false)
    })

    it('only admin can edit settings', () => {
      expect(roleHasPermission('admin', Permission.EDIT_SETTINGS)).toBe(true)
      expect(roleHasPermission('moderator', Permission.EDIT_SETTINGS)).toBe(false)
      expect(roleHasPermission('user', Permission.EDIT_SETTINGS)).toBe(false)
    })

    it('only admin can delete users', () => {
      expect(roleHasPermission('admin', Permission.DELETE_USERS)).toBe(true)
      expect(roleHasPermission('moderator', Permission.DELETE_USERS)).toBe(false)
      expect(roleHasPermission('user', Permission.DELETE_USERS)).toBe(false)
    })

    it('only admin and moderator can view audit logs', () => {
      expect(roleHasPermission('admin', Permission.VIEW_AUDIT_LOGS)).toBe(true)
      expect(roleHasPermission('moderator', Permission.VIEW_AUDIT_LOGS)).toBe(true)
      expect(roleHasPermission('user', Permission.VIEW_AUDIT_LOGS)).toBe(false)
    })
  })
})
