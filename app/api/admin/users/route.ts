/**
 * Users API Routes
 * GET /api/admin/users - List users with pagination and filters
 * POST /api/admin/users - Create a new user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import { prisma } from '@/lib/db/prisma'
import { createAuditLog, updateUserRole, updateUserStatus } from '@/lib/db/helpers'
import type { UserRole, UserStatus } from '@/lib/auth/types'

/**
 * GET /api/admin/users
 * List users with pagination, filtering, and search
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(Permission.VIEW_USERS)

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '10')))
    const role = searchParams.get('role') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    // Get total count for pagination
    const total = await prisma.user_roles.count()

    // Fetch users with pagination
    const skip = (page - 1) * pageSize

    // Note: Prisma doesn't properly type the string enum filter, so we cast it
    const userRoles = await prisma.user_roles.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: role ? { role: role as any } : undefined,
      orderBy: {
        updated_at: 'desc',
      },
      skip,
      take: pageSize,
    })

    // Fetch related user and profile data
    const userIds = userRoles.map((ur) => ur.user_id)
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        created_at: true,
      },
    })

    const profiles = await prisma.user_profiles.findMany({
      where: { user_id: { in: userIds } },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))
    const profileMap = new Map(profiles.map((p) => [p.user_id, p]))

    // Build response
    let results = userRoles.map((ur) => {
      const user = userMap.get(ur.user_id)
      const profile = profileMap.get(ur.user_id)

      return {
        id: ur.user_id,
        email: user?.email || '',
        fullName: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        role: ur.role,
        status: profile?.status || 'pending',
        lastLoginAt: profile?.last_login_at || null,
        createdAt: user?.created_at,
      }
    })

    // Filter by status and search on results
    if (status) {
      results = results.filter((u) => u.status === status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      results = results.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          u.fullName?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      users: results,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Error fetching users:', error)

    if (error instanceof Error && error.message.includes('Permission')) {
      return NextResponse.json(
        { message: 'No tienes permiso para ver usuarios' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    await requirePermission(Permission.CREATE_USERS)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, fullName, role, status } = body

    // Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { message: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!role || !['admin', 'moderator', 'user'].includes(role)) {
      return NextResponse.json(
        { message: 'Rol inválido' },
        { status: 400 }
      )
    }

    if (!status || !['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return NextResponse.json(
        { message: 'Estado inválido' },
        { status: 400 }
      )
    }

    // For now, we'll create the user in our database
    // In a real implementation, you'd create a Supabase auth user first
    // and use the returned UUID as the user_id

    // Create user role
    await updateUserRole(email, role as UserRole, currentUser.id)

    // Create user profile
    await updateUserStatus(email, status as UserStatus)

    // Update profile with additional data
    await prisma.user_profiles.update({
      where: { user_id: email },
      data: {
        full_name: fullName || null,
      },
    })

    // Create audit log
    await createAuditLog({
      user_id: currentUser.id,
      action: 'user.created',
      category: 'user',
      entity_type: 'user',
      entity_id: email,
      metadata: {
        email,
        role,
        status,
      },
    })

    return NextResponse.json(
      {
        user: {
          id: email,
          email,
          fullName,
          role,
          status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)

    if (error instanceof Error && error.message.includes('Permission')) {
      return NextResponse.json(
        { message: 'No tienes permiso para crear usuarios' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
