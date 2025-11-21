/**
 * Top Users List Component
 * Displays the most active users with their stats and progress bars
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { UserActivitySummary } from '@/lib/db/views'
import Link from 'next/link'

export interface TopUsersListProps {
  users: UserActivitySummary[]
}

const roleColors: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  moderator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  moderator: 'Moderador',
  user: 'Usuario',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  pending: 'Pendiente',
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

function getRoleColor(role: string | null): string {
  if (!role) return roleColors.user
  return roleColors[role] || roleColors.user
}

function getRoleLabel(role: string | null): string {
  if (!role) return 'Usuario'
  return roleLabels[role] || role
}

function getStatusColor(status: string | null): string {
  if (!status) return statusColors.active
  return statusColors[status] || statusColors.active
}

function getStatusLabel(status: string | null): string {
  if (!status) return 'Activo'
  return statusLabels[status] || status
}

export function TopUsersList({ users }: TopUsersListProps) {
  if (users.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usuarios Más Activos</h3>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No hay usuarios registrados</p>
        </div>
      </Card>
    )
  }

  const maxActions = Math.max(...users.map(u => Number(u.total_actions)))

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Usuarios Más Activos</h3>
      <div className="space-y-4">
        {users.map((user, index) => {
          const actionPercentage =
            maxActions > 0 ? (Number(user.total_actions) / maxActions) * 100 : 0

          return (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="block group"
            >
              <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer">
                {/* User Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getRoleColor(user.role)}`}
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(user.status)}`}
                    >
                      {getStatusLabel(user.status)}
                    </Badge>
                  </div>
                </div>

                {/* Actions Stats and Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {Number(user.total_actions)} acciones
                    </span>
                    <span className="text-muted-foreground">
                      {actionPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${actionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Activity Breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground">Hoy</p>
                    <p className="font-semibold">
                      {Number(user.actions_today)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Semana</p>
                    <p className="font-semibold">
                      {Number(user.actions_week)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Mes</p>
                    <p className="font-semibold">
                      {Number(user.actions_month)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <Link
        href="/admin/users"
        className="block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-4 pt-4 border-t"
      >
        Ver todos los usuarios
      </Link>
    </Card>
  )
}
