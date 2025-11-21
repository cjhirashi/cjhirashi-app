/**
 * Client-side React hooks for authentication and authorization
 * Use these hooks in Client Components
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole, Permission, UserProfile, ROLE_PERMISSIONS } from './types'

/**
 * Hook to get the current user's profile
 */
export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchUser() {
      try {
        setLoading(true)

        // Get auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
          setUser(null)
          return
        }

        // Get user profile from API
        const response = await fetch('/api/auth/profile')

        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }

        const profile = await response.json()
        setUser(profile)
      } catch (err) {
        setError(err as Error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, error }
}

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useUser()

  if (!user || user.status === 'suspended') {
    return false
  }

  const permissions = ROLE_PERMISSIONS[user.role] || []
  return permissions.includes(permission)
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { user } = useUser()

  if (!user || user.status === 'suspended') {
    return false
  }

  const userPermissions = ROLE_PERMISSIONS[user.role] || []
  return permissions.some(p => userPermissions.includes(p))
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  const { user } = useUser()

  if (!user || user.status === 'suspended') {
    return false
  }

  const userPermissions = ROLE_PERMISSIONS[user.role] || []
  return permissions.every(p => userPermissions.includes(p))
}

/**
 * Hook to check if user is an admin
 */
export function useIsAdmin(): boolean {
  const { user } = useUser()
  return user?.role === 'admin' && user?.status === 'active'
}

/**
 * Hook to check if user is a moderator or admin
 */
export function useIsModerator(): boolean {
  const { user } = useUser()
  return (user?.role === 'admin' || user?.role === 'moderator') && user?.status === 'active'
}

/**
 * Hook to get user's role
 */
export function useRole(): UserRole | null {
  const { user } = useUser()
  return user?.role || null
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useUser()
  return !loading && user !== null
}
