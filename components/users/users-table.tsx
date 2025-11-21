'use client'

import { useState, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserAvatar } from './user-avatar'
import { UserRoleBadge } from './user-role-badge'
import { UserStatusBadge } from './user-status-badge'
import { EditUserModal, type EditUserModalData } from './edit-user-modal'
import { DeleteUserDialog } from './delete-user-dialog'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Edit2, Trash2 } from 'lucide-react'
import type { UserRole, UserStatus } from '@/lib/auth/types'

interface UserData {
  id: string
  email: string
  fullName?: string | null
  avatar_url?: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt?: Date | null
  createdAt: Date
}

interface UsersTableProps {
  users: UserData[]
  totalCount: number
  currentPage: number
  pageSize: number
  onRefresh?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

export function UsersTable({
  users,
  totalCount,
  currentPage,
  pageSize,
  onRefresh,
  canEdit = false,
  canDelete = false,
}: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<EditUserModalData | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditClick = useCallback((user: UserData) => {
    setEditingUser({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatar_url,
    })
    setIsEditModalOpen(true)
  }, [])

  const handleDeleteClick = useCallback((user: UserData) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }, [])

  if (users.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No se encontraron usuarios</p>
      </Card>
    )
  }

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  return (
    <>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead>Registro</TableHead>
                {(canEdit || canDelete) && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
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
                    <UserRoleBadge role={user.role} />
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
                  {(canEdit || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            title="Editar usuario"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination info */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {startIndex} a {endIndex} de {totalCount} usuarios
        </span>
      </div>

      {/* Edit Modal */}
      <EditUserModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={editingUser}
        onSuccess={onRefresh}
      />

      {/* Delete Dialog */}
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={
          deletingUser
            ? {
                id: deletingUser.id,
                email: deletingUser.email,
                fullName: deletingUser.fullName,
              }
            : null
        }
        onSuccess={onRefresh}
      />
    </>
  )
}
