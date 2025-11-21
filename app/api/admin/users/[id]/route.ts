/**
 * User Detail API Routes
 * GET /api/admin/users/[id] - Get a specific user
 * PATCH /api/admin/users/[id] - Update a specific user
 * DELETE /api/admin/users/[id] - Delete a specific user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import { prisma } from '@/lib/db/prisma'
import { createAuditLog, updateUserRole, updateUserStatus } from '@/lib/db/helpers'
import type { UserRole, UserStatus } from '@/lib/auth/types'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/users/[id]
 * Get a specific user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await requirePermission(Permission.VIEW_USERS)

    const userId = id

    // Fetch user role
    const userRole = await prisma.user_roles.findUnique({
      where: { user_id: userId },
    })

    if (!userRole) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Fetch user details
    const userDetails = await prisma.users.findUnique({
      where: { id: userId },
    })

    // Fetch user profile
    const userProfile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    })

    return NextResponse.json({
      user: {
        id: userRole.user_id,
        email: userDetails?.email || '',
        fullName: userProfile?.full_name || null,
        avatar_url: userProfile?.avatar_url || null,
        role: userRole.role,
        status: userProfile?.status || 'pending',
        lastLoginAt: userProfile?.last_login_at || null,
        createdAt: userDetails?.created_at,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)

    if (error instanceof Error && error.message.includes('Permission')) {
      return NextResponse.json(
        { message: 'No tienes permiso para ver este usuario' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update a specific user
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    const canEdit = await requirePermission(Permission.EDIT_USERS)
      .then(() => true)
      .catch(() => false)

    const canManageRoles = await requirePermission(Permission.MANAGE_USER_ROLES)
      .then(() => true)
      .catch(() => false)

    if (!canEdit && !canManageRoles) {
      return NextResponse.json(
        { message: 'No tienes permiso para editar usuarios' },
        { status: 403 }
      )
    }

    const userId = id
    const body = await request.json()
    const { fullName, role, status, avatarUrl } = body

    // Fetch existing user
    const existingUserRole = await prisma.user_roles.findUnique({
      where: { user_id: userId },
    })

    if (!existingUserRole) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const userDetails = await prisma.users.findUnique({
      where: { id: userId },
    })

    const userEmail = userDetails?.email || ''
    const changes: Record<string, unknown> = {}

    // Update user role if provided
    if (role && role !== existingUserRole.role && canManageRoles) {
      if (userId === currentUser.id && role !== 'admin') {
        return NextResponse.json(
          { message: 'No puedes eliminar tu propio rol de administrador' },
          { status: 400 }
        )
      }

      await updateUserRole(userId, role as UserRole, currentUser.id)
      changes.role = { from: existingUserRole.role, to: role }
    }

    // Update user status if provided
    if (status && status !== existingUserRole.role) {
      await updateUserStatus(userId, status as UserStatus)
      changes.status = { from: existingUserRole.role, to: status }
    }

    // Update user profile
    const profileUpdates: Record<string, unknown> = {}
    if (fullName !== undefined) {
      profileUpdates.full_name = fullName || null
      changes.fullName = { from: undefined, to: fullName }
    }
    if (avatarUrl !== undefined) {
      profileUpdates.avatar_url = avatarUrl || null
      changes.avatarUrl = { from: undefined, to: avatarUrl }
    }

    if (Object.keys(profileUpdates).length > 0) {
      await prisma.user_profiles.update({
        where: { user_id: userId },
        data: profileUpdates,
      })
    }

    // Create audit log
    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        user_id: currentUser.id,
        action: 'user.updated',
        category: 'user',
        entity_type: 'user',
        entity_id: userId,
        metadata: {
          email: userEmail,
          changes,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
    })
  } catch (error) {
    console.error('Error updating user:', error)

    if (error instanceof Error && error.message.includes('Permission')) {
      return NextResponse.json(
        { message: 'No tienes permiso para actualizar este usuario' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a specific user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await requirePermission(Permission.DELETE_USERS)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = id

    // Prevent users from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json(
        { message: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      )
    }

    // Fetch user to verify they exist
    const userToDelete = await prisma.user_roles.findUnique({
      where: { user_id: userId },
    })

    if (!userToDelete) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const userDetails = await prisma.users.findUnique({
      where: { id: userId },
    })

    const userEmail = userDetails?.email || ''

    // Delete user profile
    await prisma.user_profiles.delete({
      where: { user_id: userId },
    }).catch(() => {
      // Profile might not exist
    })

    // Delete user role
    await prisma.user_roles.delete({
      where: { user_id: userId },
    })

    // Create audit log
    await createAuditLog({
      user_id: currentUser.id,
      action: 'user.deleted',
      category: 'user',
      entity_type: 'user',
      entity_id: userId,
      metadata: {
        email: userEmail,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error deleting user:', error)

    if (error instanceof Error && error.message.includes('Permission')) {
      return NextResponse.json(
        { message: 'No tienes permiso para eliminar usuarios' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
