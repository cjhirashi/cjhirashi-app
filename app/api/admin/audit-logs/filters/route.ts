/**
 * Audit Logs Filters API Route
 * GET /api/admin/audit-logs/filters - Get unique values for filter dropdowns
 */

import { NextResponse } from 'next/server'
import { requirePermission, Permission } from '@/lib/auth/server'
import {
  getUniqueActions,
  getUniqueCategories,
  getUniqueResourceTypes,
} from '@/lib/db/audit-helpers'

/**
 * GET /api/admin/audit-logs/filters
 * Get unique values for filter dropdowns
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check permission
    await requirePermission(Permission.VIEW_AUDIT_LOGS)

    // Fetch unique values for filters
    const [actions, categories, resourceTypes] = await Promise.all([
      getUniqueActions(),
      getUniqueCategories(),
      getUniqueResourceTypes(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        actions: actions || [],
        categories: categories || [],
        resourceTypes: (resourceTypes || []).filter((rt) => rt !== null),
      },
    })
  } catch (error) {
    console.error('Error fetching audit log filters:', error)

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
        error: 'Error al obtener los filtros',
      },
      { status: 500 },
    )
  }
}
