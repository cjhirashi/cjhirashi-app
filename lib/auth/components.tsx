/**
 * Authorization components
 * Use these to conditionally render content based on permissions
 */

'use client'

import { ReactNode } from 'react'
import { usePermission, useIsAdmin, useIsModerator, useUser } from './hooks'
import { Permission, UserRole } from './types'

interface ProtectedProps {
  children: ReactNode
  fallback?: ReactNode
}

interface PermissionGuardProps extends ProtectedProps {
  permission: Permission
}

interface RoleGuardProps extends ProtectedProps {
  role: UserRole | UserRole[]
}

/**
 * Only render children if user has the required permission
 */
export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const hasPermission = usePermission(permission)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Only render children if user is an admin
 */
export function AdminOnly({ children, fallback = null }: ProtectedProps) {
  const isAdmin = useIsAdmin()

  if (!isAdmin) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Only render children if user is a moderator or admin
 */
export function ModeratorOnly({ children, fallback = null }: ProtectedProps) {
  const isModerator = useIsModerator()

  if (!isModerator) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Only render children if user has one of the specified roles
 */
export function RoleGuard({ children, role, fallback = null }: RoleGuardProps) {
  const { user } = useUser()

  const roles = Array.isArray(role) ? role : [role]
  const hasRole = user && roles.includes(user.role)

  if (!hasRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Show loading state while checking authentication
 */
export function AuthLoader({ children, loading }: { children: ReactNode; loading?: ReactNode }) {
  const { user, loading: isLoading } = useUser()

  if (isLoading) {
    return <>{loading || <div>Loading...</div>}</>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
