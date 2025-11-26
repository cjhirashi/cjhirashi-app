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
 *
 * NOTE: This hook uses a global cache to prevent multiple fetch calls
 * and infinite re-renders. All components share the same user state.
 */

// Global cache to prevent multiple fetch calls
let userCache: { user: UserProfile | null; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Global subscribers for cache updates
const subscribers = new Set<(user: UserProfile | null) => void>()

function notifySubscribers(user: UserProfile | null) {
  subscribers.forEach(cb => cb(user))
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true
    let retryCount = 0
    const MAX_RETRIES = 2

    async function fetchUser() {
      try {
        // Check cache first
        if (userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
          if (isMounted) {
            setUser(userCache.user)
            setError(null)
            setLoading(false)
          }
          return
        }

        // Get auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
          if (isMounted) {
            setUser(null)
            setError(null)
            setLoading(false)
          }
          userCache = { user: null, timestamp: Date.now() }
          notifySubscribers(null)
          return
        }

        // Get user profile from API with timeout
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        try {
          const response = await fetch('/api/auth/profile', { signal: controller.signal })

          clearTimeout(timeout)

          if (!response.ok) {
            throw new Error('Failed to fetch user profile')
          }

          const profile = await response.json()

          if (isMounted) {
            setUser(profile)
            setError(null)
            setLoading(false)
          }

          // Update cache
          userCache = { user: profile, timestamp: Date.now() }
          notifySubscribers(profile)
          retryCount = 0
        } catch (err) {
          clearTimeout(timeout)

          // Only retry on network errors, not on 404/401
          if (retryCount < MAX_RETRIES && err instanceof Error && err.name === 'AbortError') {
            retryCount++
            setTimeout(fetchUser, 1000 * Math.pow(2, retryCount)) // Exponential backoff
            return
          }

          if (isMounted) {
            setError(err as Error)
            setUser(null)
            setLoading(false)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setUser(null)
          setLoading(false)
        }
      }
    }

    // Initial fetch
    fetchUser()

    // Listen for auth changes - only refetch if auth actually changed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only refetch on login/logout, not on every event
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        userCache = null // Invalidate cache
        fetchUser()
      }
    })

    // Subscribe to cache updates
    const subscriber = (cachedUser: UserProfile | null) => {
      if (isMounted) {
        setUser(cachedUser)
      }
    }
    subscribers.add(subscriber)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      subscribers.delete(subscriber)
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
