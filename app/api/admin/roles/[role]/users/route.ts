/**
 * API Route: Get users by role
 * GET /api/admin/roles/[role]/users
 *
 * Returns all users with a specific role
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, Permission } from '@/lib/auth/server'
import { getUsersByRole } from '@/lib/db/roles-helpers'
import type { user_role as UserRoleEnum } from '@/lib/generated/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    // Require VIEW_ROLES permission
    await requirePermission(Permission.VIEW_ROLES)

    // Get role from params
    const { role } = await params

    // Validate role
    const validRoles = ['admin', 'moderator', 'user']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role', message: 'El rol especificado no es válido' },
        { status: 400 }
      )
    }

    // Fetch users by role
    const users = await getUsersByRole(role as UserRoleEnum)

    return NextResponse.json({
      users,
      total: users.length,
    })
  } catch (error) {
    console.error('Error fetching users by role:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No tienes permisos para ver roles' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error al obtener usuarios por rol' },
      { status: 500 }
    )
  }
}
