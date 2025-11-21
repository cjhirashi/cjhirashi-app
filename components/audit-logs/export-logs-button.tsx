'use client'

/**
 * Export Audit Logs Button Component
 * Allows exporting audit logs as CSV or JSON
 */

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { AuditLogFilters } from '@/lib/db/audit-helpers'

interface ExportLogsButtonProps {
  filters: AuditLogFilters
  disabled?: boolean
}

export function ExportLogsButton({ filters, disabled = false }: ExportLogsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          format,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al exportar logs')
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/)
        if (match) {
          filename = match[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Logs exportados como ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al exportar logs')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isLoading}>
          <Download className="mr-2 h-4 w-4" />
          {isLoading ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isLoading}>
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} disabled={isLoading}>
          Exportar como JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
