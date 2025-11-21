'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileJson, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AnalyticsFilters } from '@/lib/types/analytics'
import { dateToISOString } from '@/lib/utils/analytics-utils'

interface ExportReportButtonProps {
  filters: AnalyticsFilters
}

type ExportFormat = 'csv' | 'pdf' | 'xlsx'

export function ExportReportButton({
  filters,
}: ExportReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            ...filters,
            dateRange: {
              from: dateToISOString(filters.dateRange.from),
              to: dateToISOString(filters.dateRange.to),
            },
            compareWith: filters.compareWith ? {
              from: dateToISOString(filters.compareWith.from),
              to: dateToISOString(filters.compareWith.to),
            } : undefined,
          },
          format,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      // Get the content disposition header to get the filename
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `analytics-report.${format}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Reporte exportado en formato ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Error al exportar el reporte')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileJson className="h-4 w-4" />
          )}
          {isLoading ? 'Exportando...' : 'Exportar Reporte'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isLoading}
        >
          <FileText className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isLoading}
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF (Próximamente)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('xlsx')}
          disabled={isLoading}
        >
          <FileText className="h-4 w-4 mr-2" />
          Excel (Próximamente)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
