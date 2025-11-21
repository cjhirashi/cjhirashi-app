'use client'

/**
 * Audit Log Details Modal Component
 * Displays full details of an audit log entry
 */

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Copy, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActionCategoryBadge } from '@/components/audit-logs/action-category-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import type { AuditLogWithUser } from '@/lib/db/audit-helpers'

interface AuditLogDetailsModalProps {
  log: AuditLogWithUser
  isOpen: boolean
  onClose: () => void
}

export function AuditLogDetailsModal({ log, isOpen, onClose }: AuditLogDetailsModalProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="flex items-center gap-2">
                <code className="text-base">{log.action}</code>
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm:ss', { locale: es })}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="recurso">Recurso</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="contexto">Contexto</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-3 font-semibold">Usuario</h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {log.user_name?.charAt(0).toUpperCase() || log.user_email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{log.user_name || log.user_email || 'Sistema'}</p>
                    <p className="text-xs text-muted-foreground">{log.user_email}</p>
                    <p className="text-xs text-muted-foreground">Rol: {log.user_role || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-3 font-semibold">Acción</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Acción:</span>
                    <code className="text-sm">{log.action}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Categoría:</span>
                    <ActionCategoryBadge category={log.action_category} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recurso" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="mb-3 font-semibold">Información del Recurso</h3>
              {log.resource_type ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Recurso</p>
                    <p className="mt-1 font-medium">{log.resource_type}</p>
                  </div>
                  {log.resource_id && (
                    <div>
                      <p className="text-xs text-muted-foreground">ID del Recurso</p>
                      <div className="mt-1 flex items-center justify-between rounded bg-background p-2">
                        <code className="text-xs">{log.resource_id}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(log.resource_id!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay información de recurso</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="mb-3 font-semibold">Cambios</h3>
              {log.changes ? (
                <pre className="overflow-x-auto rounded bg-background p-3 text-xs">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No hay cambios registrados</p>
              )}
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h3 className="mb-3 font-semibold">Metadata Adicional</h3>
              {log.metadata ? (
                <pre className="overflow-x-auto rounded bg-background p-3 text-xs">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No hay metadata adicional</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contexto" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="mb-3 font-semibold">Contexto de la Acción</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">ID del Log</p>
                  <div className="mt-1 flex items-center justify-between rounded bg-background p-2">
                    <code className="text-xs">{log.id}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(log.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">ID del Usuario</p>
                  <div className="mt-1 flex items-center justify-between rounded bg-background p-2">
                    <code className="text-xs">{log.user_id}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(log.user_id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {log.ip_address && (
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección IP</p>
                    <p className="mt-1">{log.ip_address}</p>
                  </div>
                )}

                {log.user_agent && (
                  <div>
                    <p className="text-xs text-muted-foreground">User Agent</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{log.user_agent}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Fecha y Hora</p>
                  <p className="mt-1 text-sm">
                    {format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm:ss', { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
