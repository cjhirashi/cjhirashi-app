/**
 * Database Helper Functions
 *
 * Common queries and utilities for working with the database
 */

import { prisma } from './prisma'
import type {
  user_role as UserRole,
  user_status as UserStatus,
  audit_action_category as AuditActionCategory
} from '@/lib/generated/prisma'

/**
 * User Management Helpers
 */

export async function getUserWithProfile(userId: string) {
  const [userRole, userProfile] = await Promise.all([
    prisma.user_roles.findUnique({
      where: { user_id: userId },
    }),
    prisma.user_profiles.findUnique({
      where: { user_id: userId },
    }),
  ])

  if (!userRole) {
    return null
  }

  return {
    ...userRole,
    user_profiles: userProfile,
  }
}

export async function getUsersByRole(role: UserRole) {
  const userRoles = await prisma.user_roles.findMany({
    where: { role },
    orderBy: {
      assigned_at: 'desc',
    },
  })

  // Fetch profiles for all users
  const userIds = userRoles.map(ur => ur.user_id)
  const profiles = await prisma.user_profiles.findMany({
    where: { user_id: { in: userIds } },
  })

  const profileMap = new Map(profiles.map(p => [p.user_id, p]))

  return userRoles.map(ur => ({
    ...ur,
    user_profiles: profileMap.get(ur.user_id) || null,
  }))
}

export async function getUsersByStatus(status: UserStatus) {
  const profiles = await prisma.user_profiles.findMany({
    where: { status },
    orderBy: {
      updated_at: 'desc',
    },
  })

  // Fetch roles for all users
  const userIds = profiles.map(p => p.user_id)
  const roles = await prisma.user_roles.findMany({
    where: { user_id: { in: userIds } },
  })

  const roleMap = new Map(roles.map(r => [r.user_id, r]))

  return profiles.map(p => ({
    ...p,
    user_roles: roleMap.get(p.user_id) || null,
  }))
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
  assignedBy: string
) {
  return await prisma.user_roles.upsert({
    where: { user_id: userId },
    update: {
      role,
      assigned_by: assignedBy,
      updated_at: new Date(),
    },
    create: {
      user_id: userId,
      role,
      assigned_by: assignedBy,
    },
  })
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus
) {
  return await prisma.user_profiles.upsert({
    where: { user_id: userId },
    update: {
      status,
      updated_at: new Date(),
    },
    create: {
      user_id: userId,
      status,
    },
  })
}

/**
 * Audit Logging Helpers
 */

export async function createAuditLog(data: {
  user_id: string
  action: string
  category: AuditActionCategory
  entity_type?: string
  entity_id?: string
  description?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, unknown>
}) {
  const { category, description, ...rest } = data

  return await prisma.audit_logs.create({
    data: {
      ...rest,
      action_category: category,
      metadata: description
        ? { ...data.metadata, description }
        : (data.metadata as any),
    },
  })
}

export async function getAuditLogs(options?: {
  userId?: string
  category?: AuditActionCategory
  entityType?: string
  entityId?: string
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (options?.userId) {
    where.user_id = options.userId
  }

  if (options?.category) {
    where.category = options.category
  }

  if (options?.entityType) {
    where.entity_type = options.entityType
  }

  if (options?.entityId) {
    where.entity_id = options.entityId
  }

  return await prisma.audit_logs.findMany({
    where,
    orderBy: {
      created_at: 'desc',
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  })
}

/**
 * System Settings Helpers
 */

export async function getSystemSetting(key: string) {
  return await prisma.system_settings.findUnique({
    where: { key },
  })
}

export async function getSystemSettings() {
  return await prisma.system_settings.findMany({
    orderBy: {
      key: 'asc',
    },
  })
}

export async function updateSystemSetting(
  key: string,
  value: string,
  updatedBy: string
) {
  return await prisma.system_settings.update({
    where: { key },
    data: {
      value,
      updated_by: updatedBy,
      updated_at: new Date(),
    },
  })
}

/**
 * Utility Functions
 */

export async function isUserAdmin(userId: string): Promise<boolean> {
  const userRole = await prisma.user_roles.findUnique({
    where: { user_id: userId },
    select: { role: true },
  })

  return userRole?.role === 'admin'
}

export async function isUserModerator(userId: string): Promise<boolean> {
  const userRole = await prisma.user_roles.findUnique({
    where: { user_id: userId },
    select: { role: true },
  })

  return userRole?.role === 'admin' || userRole?.role === 'moderator'
}

export async function canManageUsers(userId: string): Promise<boolean> {
  return await isUserModerator(userId)
}

export async function canManageSettings(userId: string): Promise<boolean> {
  return await isUserAdmin(userId)
}

/**
 * Get all system settings grouped by category
 */
export async function getAllSystemSettingsGrouped() {
  const settings = await getSystemSettings()
  const grouped: Record<string, typeof settings> = {}

  for (const setting of settings) {
    if (!grouped[setting.category]) {
      grouped[setting.category] = []
    }
    grouped[setting.category].push(setting)
  }

  return grouped
}

/**
 * Get system settings by category
 */
export async function getSystemSettingsByCategory(category: string) {
  return await prisma.system_settings.findMany({
    where: { category },
    orderBy: { key: 'asc' },
  })
}

/**
 * Bulk update multiple settings in a transaction
 */
export async function bulkUpdateSystemSettings(
  updates: Array<{ key: string; value: string }>,
  updatedBy: string,
) {
  return await prisma.$transaction(
    updates.map(({ key, value }) =>
      prisma.system_settings.update({
        where: { key },
        data: {
          value,
          updated_by: updatedBy,
          updated_at: new Date(),
        },
      }),
    ),
  )
}
