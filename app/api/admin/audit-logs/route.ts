/**
 * Audit Logs API Route
 * GET /api/admin/audit-logs - List audit logs with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import { getAuditLogsWithFilters } from '@/lib/db/audit-helpers'
import type { AuditLogFilters, audit_action_category as AuditActionCategory } from '@/lib/db/audit-helpers'

/**
 * GET /api/admin/audit-logs
 * List audit logs with filtering and pagination
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 50, max: 100)
 * - userId: string (UUID)
 * - action: string
 * - actionCategory: string (enum)
 * - resourceType: string
 * - resourceId: string
 * - ipAddress: string
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - search: string
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission(Permission.VIEW_AUDIT_LOGS)

    // Get current user for audit purposes
    await getCurrentUser()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams

    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '50')))

    // Build filters
    const filters: AuditLogFilters = {}

    if (searchParams.has('userId')) {
      filters.userId = searchParams.get('userId') || undefined
    }

    if (searchParams.has('action')) {
      const action = searchParams.get('action')
      if (action) {
        filters.action = action
      }
    }

    if (searchParams.has('actionCategory')) {
      const category = searchParams.get('actionCategory')
      if (category) {
        filters.actionCategory = category as AuditActionCategory
      }
    }

    if (searchParams.has('resourceType')) {
      const resourceType = searchParams.get('resourceType')
      if (resourceType) {
        filters.resourceType = resourceType
      }
    }

    if (searchParams.has('resourceId')) {
      const resourceId = searchParams.get('resourceId')
      if (resourceId) {
        filters.resourceId = resourceId
      }
    }

    if (searchParams.has('ipAddress')) {
      const ipAddress = searchParams.get('ipAddress')
      if (ipAddress) {
        filters.ipAddress = ipAddress
      }
    }

    if (searchParams.has('startDate')) {
      const startDate = searchParams.get('startDate')
      if (startDate) {
        try {
          filters.startDate = new Date(startDate)
        } catch (error) {
          console.error('Invalid startDate:', error)
        }
      }
    }

    if (searchParams.has('endDate')) {
      const endDate = searchParams.get('endDate')
      if (endDate) {
        try {
          filters.endDate = new Date(endDate)
        } catch (error) {
          console.error('Invalid endDate:', error)
        }
      }
    }

    if (searchParams.has('search')) {
      const search = searchParams.get('search')
      if (search) {
        filters.search = search
      }
    }

    // Fetch audit logs with filters
    const result = await getAuditLogsWithFilters(filters, page, pageSize)

    return NextResponse.json({
      success: true,
      data: {
        logs: result.logs,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)

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
        error: 'Error al obtener los logs de auditoría',
      },
      { status: 500 },
    )
  }
}
