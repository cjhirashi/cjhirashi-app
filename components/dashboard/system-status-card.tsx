/**
 * System Status Card Component
 * Displays system health, last refresh time, and app version
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { RotateCcw, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { useRefreshStats } from '@/hooks/use-refresh-stats'
import type { DashboardStats } from '@/lib/db/views'

export interface SystemStatusCardProps {
  stats: DashboardStats
  appVersion?: string
}

export function SystemStatusCard({
  stats,
  appVersion = '1.0.0',
}: SystemStatusCardProps) {
  const { refresh, isLoading, error } = useRefreshStats()

  const lastRefreshTime = formatDistanceToNow(new Date(stats.refreshed_at), {
    addSuffix: true,
    locale: es,
  })

  const handleRefresh = async () => {
    try {
      await refresh()
      // Optionally: trigger a page revalidation or state update
      // You might want to add a callback here for the parent component
    } catch {
      // Error is already handled by the hook
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>

      <div className="space-y-4">
        {/* Database Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Base de Datos</p>
              <p className="text-xs text-muted-foreground">PostgreSQL</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        </div>

        <Separator />

        {/* Last Refresh */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Última Actualización</p>
            <p className="text-sm text-muted-foreground">{lastRefreshTime}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(stats.refreshed_at).toLocaleString('es-ES')}
          </p>
        </div>

        <Separator />

        {/* Version */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Versión de la Aplicación</p>
          <Badge variant="outline">{appVersion}</Badge>
        </div>

        <Separator />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Actualizando...' : 'Refrescar Estadísticas'}
        </Button>
      </div>
    </Card>
  )
}
