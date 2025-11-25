/**
 * Authorization middleware helpers
 * Used in Next.js middleware to protect admin routes
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { UserRole } from './types'

/**
 * Get user role from middleware context
 * This is a lightweight version that doesn't use Prisma (too heavy for middleware)
 */
async function getUserRoleFromMiddleware(
  request: NextRequest
): Promise<UserRole | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Query the database for user role using raw query
  // We use raw query because Prisma client is too heavy for middleware
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data.role as UserRole
}

/**
 * Protect admin routes
 * Call this after updateSession in the main middleware
 */
export async function protectAdminRoutes(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is an admin route
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Get user role
  const role = await getUserRoleFromMiddleware(request)

  // If no role found, redirect to login
  if (!role) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Check if user has access to admin panel
  if (role !== 'admin' && role !== 'moderator') {
    // Regular users cannot access admin panel
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  // User has access, continue
  return NextResponse.next()
}

/**
 * Check if user can access a specific admin section
 */
export async function checkAdminAccess(
  request: NextRequest,
  requiredRole: 'admin' | 'moderator' = 'moderator'
): Promise<boolean> {
  const role = await getUserRoleFromMiddleware(request)

  if (!role) {
    return false
  }

  if (requiredRole === 'admin') {
    return role === 'admin'
  }

  // Moderator or admin
  return role === 'admin' || role === 'moderator'
}
