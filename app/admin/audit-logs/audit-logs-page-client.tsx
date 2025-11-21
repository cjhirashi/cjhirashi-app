'use client'

/**
 * Audit Logs Page Client Component
 * Handles filtering, pagination, and display of audit logs
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuditLogFilters } from '@/components/audit-logs/audit-log-filters'
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table'
import { ExportLogsButton } from '@/components/audit-logs/export-logs-button'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AuditLogWithUser, AuditLogFilters as AuditLogFiltersType } from '@/lib/db/audit-helpers'
import type { audit_action_category as AuditActionCategory } from '@/lib/generated/prisma'

interface AuditLogsPageClientProps {
  initialActions: string[]
  initialCategories: AuditActionCategory[]
  initialResourceTypes: (string | null)[]
}

interface FetchResponse {
  success: boolean
  data?: {
    logs: AuditLogWithUser[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }
  error?: string
}

export function AuditLogsPageClient({
  initialActions,
  initialCategories,
  initialResourceTypes,
}: AuditLogsPageClientProps) {

  const [logs, setLogs] = useState<AuditLogWithUser[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<AuditLogFiltersType>({})

  // Fetch filters data
  const [filterOptions] = useState({
    actions: initialActions,
    categories: initialCategories,
    resourceTypes: initialResourceTypes,
  })

  // Fetch audit logs
  const fetchLogs = useCallback(
    async (page: number, currentFilters: AuditLogFiltersType) => {
      try {
        setIsLoading(true)

        // Build query parameters
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', '50')

        if (currentFilters.userId) {
          params.set('userId', currentFilters.userId)
        }
        if (currentFilters.action) {
          params.set('action', currentFilters.action)
        }
        if (currentFilters.actionCategory) {
          params.set('actionCategory', currentFilters.actionCategory)
        }
        if (currentFilters.resourceType) {
          params.set('resourceType', currentFilters.resourceType)
        }
        if (currentFilters.resourceId) {
          params.set('resourceId', currentFilters.resourceId)
        }
        if (currentFilters.ipAddress) {
          params.set('ipAddress', currentFilters.ipAddress)
        }
        if (currentFilters.startDate) {
          params.set('startDate', currentFilters.startDate.toISOString())
        }
        if (currentFilters.endDate) {
          params.set('endDate', currentFilters.endDate.toISOString())
        }
        if (currentFilters.search) {
          params.set('search', currentFilters.search)
        }

        const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)

        if (!response.ok) {
          const data = (await response.json()) as FetchResponse
          throw new Error(data.error || 'Error al cargar los logs')
        }

        const data = (await response.json()) as FetchResponse
        if (data.success && data.data) {
          setLogs(data.data.logs)
          setPagination(data.data.pagination)
        }
      } catch (error) {
        console.error('Error fetching logs:', error)
        toast.error(error instanceof Error ? error.message : 'Error al cargar los logs')
        setLogs([])
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: AuditLogFiltersType) => {
      setFilters(newFilters)
      fetchLogs(1, newFilters)
    },
    [fetchLogs],
  )

  // Handle pagination
  const handlePreviousPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchLogs(pagination.page - 1, filters)
    }
  }, [pagination.page, filters, fetchLogs])

  const handleNextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchLogs(pagination.page + 1, filters)
    }
  }, [pagination.page, pagination.totalPages, filters, fetchLogs])

  // Load initial data
  useEffect(() => {
    fetchLogs(1, {})
  }, [fetchLogs])

  // Memoize computed values
  const canGoPrevious = useMemo(() => pagination.page > 1, [pagination.page])
  const canGoNext = useMemo(
    () => pagination.page < pagination.totalPages,
    [pagination.page, pagination.totalPages],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Actividad</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Historial de acciones y cambios en el sistema
          </p>
        </div>
        <ExportLogsButton filters={filters} />
      </div>

      {/* Filters */}
      <AuditLogFilters
        actions={filterOptions.actions}
        categories={filterOptions.categories}
        resourceTypes={filterOptions.resourceTypes}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
      />

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <AuditLogsTable logs={logs} isLoading={isLoading} />
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>
            {' '}de{' '}
            <span className="font-medium">{pagination.total}</span>
            {' '}registros
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!canGoPrevious || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i
                if (pageNum > pagination.totalPages) {
                  return null
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => fetchLogs(pageNum, filters)}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!canGoNext || isLoading}
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
