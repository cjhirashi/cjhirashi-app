'use client'

/**
 * Audit Logs Table Component
 * Displays audit logs in a sortable table with details view
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ActionCategoryBadge } from '@/components/audit-logs/action-category-badge'
import { AuditLogDetailsModal } from '@/components/audit-logs/audit-log-details-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { AuditLogWithUser } from '@/lib/db/audit-helpers'

interface AuditLogsTableProps {
  logs: AuditLogWithUser[]
  isLoading?: boolean
  onSelectLog?: (log: AuditLogWithUser) => void
}

function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function AuditLogsTable({ logs, isLoading = false, onSelectLog }: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null)

  const handleSelectLog = (log: AuditLogWithUser) => {
    setSelectedLog(log)
    onSelectLog?.(log)
  }

  if (!isLoading && logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay logs de auditoría que mostrar</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Fecha/Hora</TableHead>
              <TableHead className="whitespace-nowrap">Usuario</TableHead>
              <TableHead className="whitespace-nowrap">Acción</TableHead>
              <TableHead className="whitespace-nowrap">Categoría</TableHead>
              <TableHead className="whitespace-nowrap">Recurso</TableHead>
              <TableHead className="whitespace-nowrap">IP</TableHead>
              <TableHead className="w-16 text-right">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{isLoading ? <TableSkeleton /> : renderTableRows(logs, handleSelectLog)}</TableBody>
        </Table>
      </div>

      {selectedLog && (
        <AuditLogDetailsModal
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  )
}

function renderTableRows(logs: AuditLogWithUser[], onSelectLog: (log: AuditLogWithUser) => void) {
  if (logs.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center text-muted-foreground">
          No hay datos
        </TableCell>
      </TableRow>
    )
  }

  return logs.map((log) => (
    <TableRow key={log.id}>
      <TableCell className="whitespace-nowrap text-xs">
        {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {log.user_name?.charAt(0).toUpperCase() || log.user_email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{log.user_name || log.user_email || 'Sistema'}</p>
            <p className="truncate text-xs text-muted-foreground">{log.user_role || 'N/A'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <code className="text-xs">{log.action}</code>
      </TableCell>
      <TableCell>
        <ActionCategoryBadge category={log.action_category} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-xs">
        {log.resource_type ? (
          <div>
            <p className="font-medium">{log.resource_type}</p>
            {log.resource_id && <p className="text-muted-foreground">{log.resource_id}</p>}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {log.ip_address || '-'}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectLog(log)}
          aria-label="Ver detalles"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  ))
}
