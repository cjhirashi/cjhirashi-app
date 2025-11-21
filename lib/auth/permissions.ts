/**
 * Permission checking utilities
 * Server-side functions to verify user permissions
 */

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { getUserWithProfile, isUserAdmin, isUserModerator } from '@/lib/db/helpers'
import { UserRole, Permission, ROLE_PERMISSIONS, AuthorizationError, UserProfile } from './types'

/**
 * Get the current authenticated user with their role and profile
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  try {
    // Get user role and profile from database
    const userRole = await getUserWithProfile(user.id)

    if (!userRole) {
      return null
    }

    // Get email from Supabase auth
    const { data: authUser } = await supabase.auth.getUser()

    // Type assertion for user_profiles relation
    const userRoleWithProfile = userRole as typeof userRole & {
      user_profiles?: {
        status: string
        full_name?: string | null
        avatar_url?: string | null
        last_login_at?: Date | null
      } | null
    }

    return {
      id: user.id,
      email: authUser.user?.email || '',
      role: userRole.role as UserRole,
      status: (userRoleWithProfile.user_profiles?.status as any) || 'active',
      full_name: userRoleWithProfile.user_profiles?.full_name || undefined,
      avatar_url: userRoleWithProfile.user_profiles?.avatar_url || undefined,
      last_login_at: userRoleWithProfile.user_profiles?.last_login_at || undefined,
      created_at: userRole.assigned_at,
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Get user's role
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const userRole = await prisma.user_roles.findUnique({
      where: { user_id: userId },
      select: { role: true },
    })

    return userRole?.role as UserRole || null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role)
  return permissions.includes(permission)
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  // Suspended users have no permissions
  if (user.status === 'suspended') {
    return false
  }

  return roleHasPermission(user.role, permission)
}

/**
 * Check if the current user has ANY of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  if (user.status === 'suspended') {
    return false
  }

  const userPermissions = getRolePermissions(user.role)
  return permissions.some(p => userPermissions.includes(p))
}

/**
 * Check if the current user has ALL of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  if (user.status === 'suspended') {
    return false
  }

  const userPermissions = getRolePermissions(user.role)
  return permissions.every(p => userPermissions.includes(p))
}

/**
 * Require a specific permission or throw an error
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthorizationError('Authentication required')
  }

  if (user.status === 'suspended') {
    throw new AuthorizationError('Account suspended')
  }

  if (!roleHasPermission(user.role, permission)) {
    throw new AuthorizationError(
      `Permission denied: ${permission}`,
      permission,
      user.role
    )
  }
}

/**
 * Require admin role or throw an error
 */
export async function requireAdmin(): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthorizationError('Authentication required')
  }

  if (user.status === 'suspended') {
    throw new AuthorizationError('Account suspended')
  }

  if (user.role !== 'admin') {
    throw new AuthorizationError(
      'Admin access required',
      undefined,
      user.role
    )
  }
}

/**
 * Require moderator or admin role
 */
export async function requireModerator(): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthorizationError('Authentication required')
  }

  if (user.status === 'suspended') {
    throw new AuthorizationError('Account suspended')
  }

  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw new AuthorizationError(
      'Moderator access required',
      undefined,
      user.role
    )
  }
}

/**
 * Check if user is active (not suspended, inactive, or pending)
 */
export async function isUserActive(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.status === 'active'
}

/**
 * Get user status
 */
export async function getUserStatus(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.status || null
}
