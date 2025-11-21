/**
 * Recent Activity Table Component
 * Displays recent user activities with user info, action, resource, and timestamp
 */

'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { RecentActivity } from '@/lib/db/views'
import Link from 'next/link'

export interface RecentActivityTableProps {
  activities: RecentActivity[]
}

const categoryColors: Record<string, string> = {
  authentication: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  user_management: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  content_management: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  system: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

const categoryLabels: Record<string, string> = {
  authentication: 'Autenticación',
  user_management: 'Gestión de Usuarios',
  content_management: 'Gestión de Contenido',
  system: 'Sistema',
}

function getInitials(name: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || categoryColors.default
}

function getCategoryLabel(category: string): string {
  return categoryLabels[category] || category
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No hay actividad registrada</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Actividad Reciente</h3>
        <Link
          href="/admin/audit-logs"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Ver más
        </Link>
      </div>

      <ScrollArea className="h-[400px] w-full rounded-md border">
        <div className="p-4 space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
            >
              {/* User Avatar */}
              <Avatar className="h-10 w-10 mt-0.5 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(activity.user_name || activity.user_email || '')}
                </AvatarFallback>
              </Avatar>

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {activity.user_name || activity.user_email || 'Usuario desconocido'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user_email}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs flex-shrink-0 ${getCategoryColor(activity.action_category)}`}
                  >
                    {getCategoryLabel(activity.action_category)}
                  </Badge>
                </div>

                {/* Action and Resource */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-foreground">
                    {activity.action}
                    {activity.resource_type && (
                      <span className="text-muted-foreground">
                        {' '}
                        - {activity.resource_type}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
