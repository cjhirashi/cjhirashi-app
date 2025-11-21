/**
 * Roles Helper Functions
 *
 * Utilities for working with roles and permissions
 */

import { prisma } from './prisma'
import type { user_role as UserRoleEnum } from '@/lib/generated/prisma'
import type { UserRole, UserStatus } from '@/lib/auth/types'

export interface RoleStats {
  role: UserRole
  userCount: number
  description: string
}

export interface UserWithProfile {
  id: string
  email: string
  fullName: string | null
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date
}

/**
 * Get statistics for all roles
 */
export async function getRoleStats(): Promise<RoleStats[]> {
  // Get count of users per role
  const roleCounts = await prisma.user_roles.groupBy({
    by: ['role'],
    _count: {
      role: true,
    },
  })

  // Create a map of role counts
  const roleCountMap = new Map(
    roleCounts.map((rc) => [rc.role as UserRole, rc._count.role])
  )

  // Return all roles with their counts and descriptions
  const allRoles: UserRole[] = ['admin', 'moderator', 'user']

  return allRoles.map((role) => ({
    role,
    userCount: roleCountMap.get(role) || 0,
    description: getRoleDescription(role),
  }))
}

/**
 * Get descriptive text for each role
 */
function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Acceso completo al sistema. Puede gestionar usuarios, roles, configuraciones y contenido.',
    moderator: 'Puede gestionar usuarios y contenido, pero no tiene acceso a configuraciones del sistema.',
    user: 'Acceso básico al sistema. Permisos limitados para ver información.',
  }

  return descriptions[role]
}

/**
 * Get users by role with their profile information
 */
export async function getUsersByRole(role: UserRoleEnum): Promise<UserWithProfile[]> {
  // Get all user roles for the specified role
  const userRoles = await prisma.user_roles.findMany({
    where: { role },
    orderBy: {
      assigned_at: 'desc',
    },
  })

  // Get user IDs
  const userIds = userRoles.map((ur) => ur.user_id)

  if (userIds.length === 0) {
    return []
  }

  // Fetch users (for email and created_at)
  const users = await prisma.users.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      email: true,
      created_at: true,
    },
  })

  // Fetch profiles for all users
  const profiles = await prisma.user_profiles.findMany({
    where: {
      user_id: {
        in: userIds,
      },
    },
  })

  // Create maps
  const userMap = new Map(users.map((u) => [u.id, u]))
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]))

  // Combine user roles with users and profiles
  return userRoles
    .map((ur) => {
      const user = userMap.get(ur.user_id)
      const profile = profileMap.get(ur.user_id)

      if (!user) {
        return null
      }

      return {
        id: ur.user_id,
        email: user.email || '',
        fullName: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        role: ur.role as UserRole,
        status: (profile?.status || 'pending') as UserStatus,
        lastLoginAt: profile?.last_login_at || null,
        createdAt: user.created_at,
      }
    })
    .filter((user): user is UserWithProfile => user !== null)
}
