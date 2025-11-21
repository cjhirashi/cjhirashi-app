/**
 * Audit Log Details API Route
 * GET /api/admin/audit-logs/[id] - Get details of a specific audit log
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import { getAuditLogById } from '@/lib/db/audit-helpers'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/audit-logs/[id]
 * Get full details of a specific audit log
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check permission
    await requirePermission(Permission.VIEW_AUDIT_LOGS)

    // Get current user for audit purposes
    await getCurrentUser()

    const { id } = await params

    // Validate ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de log inválido',
        },
        { status: 400 },
      )
    }

    // Fetch audit log
    const log = await getAuditLogById(id)

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          error: 'Log de auditoría no encontrado',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: log,
    })
  } catch (error) {
    console.error('Error fetching audit log:', error)

    // Check if it's a permission error
    if (error instanceof Error && error.message.includes('Permission')) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para acceder a los logs de auditoría',
        },
        { status: 403 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener el log de auditoría',
      },
      { status: 500 },
    )
  }
}
