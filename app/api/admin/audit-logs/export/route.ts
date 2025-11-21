/**
 * Audit Logs Export API Route
 * POST /api/admin/audit-logs/export - Export audit logs as CSV or JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import { exportAuditLogs, createAuditLog } from '@/lib/db/audit-helpers'
import type { AuditLogFilters } from '@/lib/db/audit-helpers'

interface ExportRequest {
  filters?: AuditLogFilters
  format: 'csv' | 'json'
}

/**
 * Convert audit logs to CSV format
 */
function logsToCSV(logs: Record<string, unknown>[]): string {
  if (logs.length === 0) {
    return ''
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Fecha/Hora',
    'Usuario',
    'Email Usuario',
    'Rol Usuario',
    'Acción',
    'Categoría',
    'Tipo de Recurso',
    'ID de Recurso',
    'Dirección IP',
  ]

  // Escape CSV value
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const strValue = String(value)
    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
      return `"${strValue.replace(/"/g, '""')}"`
    }
    return strValue
  }

  // Build CSV rows
  const rows = logs.map((log) => [
    escapeCSV(log.id),
    escapeCSV((log.created_at as Date).toISOString()),
    escapeCSV(log.user_name || log.user_email || 'Sistema'),
    escapeCSV(log.user_email),
    escapeCSV(log.user_role),
    escapeCSV(log.action),
    escapeCSV(log.action_category),
    escapeCSV(log.resource_type),
    escapeCSV(log.resource_id),
    escapeCSV(log.ip_address),
  ])

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return csv
}

/**
 * POST /api/admin/audit-logs/export
 * Export audit logs with applied filters
 *
 * Request body:
 * {
 *   filters?: AuditLogFilters,
 *   format: 'csv' | 'json'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission(Permission.VIEW_AUDIT_LOGS)

    // Get current user
    const user = await getCurrentUser()

    // Parse request body
    let body: ExportRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Cuerpo de solicitud inválido',
        },
        { status: 400 },
      )
    }

    // Validate format
    if (!body.format || !['csv', 'json'].includes(body.format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de exportación inválido. Use "csv" o "json"',
        },
        { status: 400 },
      )
    }

    // Export logs
    const logs = await exportAuditLogs(body.filters || {})

    // Log the export action
    if (user) {
      try {
        await createAuditLog({
          userId: user.id,
          action: 'audit_logs.export',
          actionCategory: 'system',
          metadata: {
            format: body.format,
            count: logs.length,
            filters: body.filters,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        })
      } catch (error) {
        console.error('Error logging export action:', error)
        // Continue even if audit logging fails
      }
    }

    // Generate file content based on format
    let fileContent: string
    let contentType: string
    let filename: string

    if (body.format === 'csv') {
      fileContent = logsToCSV(logs as unknown as Record<string, unknown>[])
      contentType = 'text/csv; charset=utf-8'
      filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    } else {
      // JSON format
      fileContent = JSON.stringify(logs, null, 2)
      contentType = 'application/json'
      filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
    }

    // Return file for download
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

    return response
  } catch (error) {
    console.error('Error exporting audit logs:', error)

    // Check if it's a permission error
    if (error instanceof Error && error.message.includes('Permission')) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para exportar logs de auditoría',
        },
        { status: 403 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al exportar los logs de auditoría',
      },
      { status: 500 },
    )
  }
}
