'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Shield, Users, Loader2 } from 'lucide-react'
import { UsersByRoleTable } from './users-by-role-table'
import { Permission, ROLE_PERMISSIONS, type UserRole } from '@/lib/auth/types'
import type { UserStatus } from '@/lib/auth/types'
import { toast } from 'sonner'

interface UserByRole {
  id: string
  email: string
  fullName: string | null
  avatar_url: string | null
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date
}

interface RoleDetailsModalProps {
  role: UserRole | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string
    badgeVariant: 'destructive' | 'default' | 'secondary'
    description: string
  }
> = {
  admin: {
    label: 'Administrador',
    badgeVariant: 'destructive',
    description: 'Acceso completo al sistema. Puede gestionar usuarios, roles, configuraciones y contenido.',
  },
  moderator: {
    label: 'Moderador',
    badgeVariant: 'default',
    description: 'Puede gestionar usuarios y contenido, pero no tiene acceso a configuraciones del sistema.',
  },
  user: {
    label: 'Usuario',
    badgeVariant: 'secondary',
    description: 'Acceso básico al sistema. Permisos limitados para ver información.',
  },
}

const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.VIEW_USERS]: 'Ver usuarios',
  [Permission.CREATE_USERS]: 'Crear usuarios',
  [Permission.EDIT_USERS]: 'Editar usuarios',
  [Permission.DELETE_USERS]: 'Eliminar usuarios',
  [Permission.MANAGE_USER_ROLES]: 'Gestionar roles de usuarios',
  [Permission.VIEW_ROLES]: 'Ver roles',
  [Permission.EDIT_ROLES]: 'Editar roles',
  [Permission.VIEW_AUDIT_LOGS]: 'Ver logs de auditoría',
  [Permission.VIEW_SETTINGS]: 'Ver configuración',
  [Permission.EDIT_SETTINGS]: 'Editar configuración',
  [Permission.VIEW_DASHBOARD]: 'Ver dashboard',
  [Permission.VIEW_ANALYTICS]: 'Ver análisis',
  [Permission.VIEW_CONTENT]: 'Ver contenido',
  [Permission.CREATE_CONTENT]: 'Crear contenido',
  [Permission.EDIT_CONTENT]: 'Editar contenido',
  [Permission.DELETE_CONTENT]: 'Eliminar contenido',
}

export function RoleDetailsModal({ role, open, onOpenChange }: RoleDetailsModalProps) {
  const [users, setUsers] = useState<UserByRole[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    if (open && role) {
      fetchUsersByRole(role)
    }
  }, [open, role])

  const fetchUsersByRole = async (selectedRole: UserRole) => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch(`/api/admin/roles/${selectedRole}/users`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al cargar usuarios')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
      setUsers([])
    } finally {
      setIsLoadingUsers(false)
    }
  }

  if (!role) {
    return null
  }

  const config = ROLE_CONFIG[role]
  const permissions = ROLE_PERMISSIONS[role]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <DialogTitle className="text-2xl">{config.label}</DialogTitle>
            <Badge variant={config.badgeVariant}>{config.label}</Badge>
          </div>
          <DialogDescription className="text-base">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="permissions" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="permissions" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Permisos ({permissions.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios ({users.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="mt-4">
            <Card className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissions.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center gap-2 rounded-md border p-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {PERMISSION_LABELS[permission]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <UsersByRoleTable users={users} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
