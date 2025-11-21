'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserAvatar } from '@/components/users/user-avatar'
import { UserStatusBadge } from '@/components/users/user-status-badge'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { UserStatus } from '@/lib/auth/types'

interface UserByRole {
  id: string
  email: string
  fullName: string | null
  avatar_url: string | null
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date
}

interface UsersByRoleTableProps {
  users: UserByRole[]
}

export function UsersByRoleTable({ users }: UsersByRoleTableProps) {
  if (users.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No hay usuarios con este rol</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Usuario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      fullName={user.fullName}
                      avatarUrl={user.avatar_url}
                      email={user.email}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.fullName || user.email}
                      </span>
                      {user.fullName && (
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastLoginAt
                    ? formatDistanceToNow(new Date(user.lastLoginAt), {
                        addSuffix: true,
                        locale: es,
                      })
                    : 'Nunca'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
