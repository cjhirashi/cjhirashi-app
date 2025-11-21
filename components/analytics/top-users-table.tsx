'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { TopUser } from '@/lib/types/analytics'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface TopUsersTableProps {
  users: TopUser[]
}

const MEDALS = ['🥇', '🥈', '🥉']

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  moderator: 'bg-orange-100 text-orange-800',
  user: 'bg-blue-100 text-blue-800',
}

function getInitials(fullName: string | null): string {
  if (!fullName) return 'U'
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TopUsersTable({ users }: TopUsersTableProps) {
  if (!users || users.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usuarios Más Activos</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Sin datos disponibles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Usuarios Más Activos</h3>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Ranking</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
              <TableHead>Última Actividad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-bold">
                  <span className="text-lg">
                    {index < 3 ? MEDALS[index] : `#${index + 1}`}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarInitials>
                        {getInitials(user.fullName)}
                      </AvatarInitials>
                      <AvatarFallback>
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {user.fullName || 'Sin nombre'}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {user.role || 'user'}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {user.actionCount.toLocaleString('es-ES')}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastActionAt ? (
                    formatDistanceToNow(new Date(user.lastActionAt), {
                      addSuffix: true,
                      locale: es,
                    })
                  ) : (
                    'Sin actividad'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
