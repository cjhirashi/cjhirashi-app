/**
 * POST /api/admin/analytics/export
 *
 * Export analytics report in various formats (CSV, PDF, XLSX)
 * Requires: VIEW_ANALYTICS permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import {
  getAnalyticsMetrics,
  getUserGrowthData,
  getActivityBreakdown,
  getTopActiveUsers,
} from '@/lib/db/analytics-helpers'
import { formatDateDisplay } from '@/lib/utils/analytics-utils'
import type { AnalyticsFilters } from '@/lib/types/analytics'

interface ExportRequest {
  filters: AnalyticsFilters
  format: 'csv' | 'pdf' | 'xlsx'
}

interface ExportData {
  filters: AnalyticsFilters
  metrics: {
    totalUsers: number
    activeUsers: number
    newUsersMonth: number
    actionsMonth: number
    averageActionsPerUser: number
    growthRate: number
  }
  growth: Array<{
    date: string
    newUsers: number
    totalUsers: number
    activeUsers: number
  }>
  activity: Array<{
    category: string
    count: number
    percentage: number
  }>
  topUsers: Array<{
    fullName: string | null
    email: string | null
    role: string | null
    actionCount: number
    lastActionAt: Date | null
  }>
}

function generateCSV(data: ExportData): string {
  const lines: string[] = []

  // Header
  lines.push('REPORTE DE ANALYTICS Y ESTADÍSTICAS')
  lines.push('')
  lines.push(`Fecha de Generación: ${new Date().toLocaleString('es-ES')}`)
  lines.push(
    `Período: ${formatDateDisplay(data.filters.dateRange.from)} a ${formatDateDisplay(data.filters.dateRange.to)}`
  )
  lines.push('')

  // Metrics Section
  lines.push('MÉTRICAS PRINCIPALES')
  lines.push('---')
  lines.push(`Total Usuarios,${data.metrics.totalUsers}`)
  lines.push(`Usuarios Activos,${data.metrics.activeUsers}`)
  lines.push(`Nuevos Usuarios (Mes),${data.metrics.newUsersMonth}`)
  lines.push(`Acciones Totales (Mes),${data.metrics.actionsMonth}`)
  lines.push(`Promedio Acciones por Usuario,${data.metrics.averageActionsPerUser.toFixed(2)}`)
  lines.push(`Tasa de Crecimiento,${data.metrics.growthRate.toFixed(2)}%`)
  lines.push('')

  // Activity Breakdown
  lines.push('DESGLOSE DE ACTIVIDAD')
  lines.push('---')
  lines.push('Categoría,Acciones,Porcentaje')
  for (const activity of data.activity) {
    lines.push(`"${activity.category}",${activity.count},${activity.percentage.toFixed(2)}%`)
  }
  lines.push('')

  // Top Users
  lines.push('USUARIOS MÁS ACTIVOS')
  lines.push('---')
  lines.push('Ranking,Nombre,Email,Rol,Acciones,Última Actividad')
  for (let i = 0; i < data.topUsers.length; i++) {
    const user = data.topUsers[i]
    const lastAction = user.lastActionAt
      ? new Date(user.lastActionAt).toLocaleString('es-ES')
      : 'Sin actividad'
    lines.push(
      `${i + 1},"${user.fullName || 'Sin nombre'}","${user.email}","${user.role}",${user.actionCount},"${lastAction}"`
    )
  }
  lines.push('')

  // Growth Data (summary)
  if (data.growth && data.growth.length > 0) {
    lines.push('DATOS DE CRECIMIENTO (ÚLTIMOS 5 DÍAS)')
    lines.push('---')
    lines.push('Fecha,Usuarios Nuevos,Total Usuarios,Usuarios Activos')
    const lastFive = data.growth.slice(-5)
    for (const row of lastFive) {
      lines.push(`${row.date},${row.newUsers},${row.totalUsers},${row.activeUsers}`)
    }
  }

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and permission
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      await requirePermission(Permission.VIEW_ANALYTICS)
    } catch {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: ExportRequest = await request.json()

    if (!body.filters || !body.format) {
      return NextResponse.json(
        { error: 'Missing filters or format' },
        { status: 400 }
      )
    }

    const { filters, format } = body

    // Parse dates
    const from = new Date(filters.dateRange.from)
    const to = new Date(filters.dateRange.to)

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Fetch all required data in parallel
    const [metrics, growth, activity, topUsers] = await Promise.all([
      getAnalyticsMetrics({ from, to }),
      getUserGrowthData({ from, to }),
      getActivityBreakdown({ from, to }),
      getTopActiveUsers({ from, to }, 10),
    ])

    const exportData = {
      filters,
      metrics,
      growth,
      activity,
      topUsers,
    }

    // Generate report based on format
    let content: string
    let contentType: string
    let filename: string

    switch (format) {
      case 'csv':
        content = generateCSV(exportData)
        contentType = 'text/csv;charset=utf-8'
        filename = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'pdf':
        // TODO: Implement PDF export with jspdf or similar
        return NextResponse.json(
          { error: 'PDF export not yet implemented' },
          { status: 501 }
        )

      case 'xlsx':
        // TODO: Implement XLSX export with xlsx library
        return NextResponse.json(
          { error: 'XLSX export not yet implemented' },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        )
    }

    // Create response with file
    const response = new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

    return response
  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
