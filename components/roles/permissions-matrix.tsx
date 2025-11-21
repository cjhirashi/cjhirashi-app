'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Permission, ROLE_PERMISSIONS, type UserRole } from '@/lib/auth/types'

interface PermissionGroup {
  name: string
  permissions: Array<{
    permission: Permission
    label: string
  }>
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Gestión de Usuarios',
    permissions: [
      { permission: Permission.VIEW_USERS, label: 'Ver usuarios' },
      { permission: Permission.CREATE_USERS, label: 'Crear usuarios' },
      { permission: Permission.EDIT_USERS, label: 'Editar usuarios' },
      { permission: Permission.DELETE_USERS, label: 'Eliminar usuarios' },
      { permission: Permission.MANAGE_USER_ROLES, label: 'Gestionar roles de usuarios' },
    ],
  },
  {
    name: 'Gestión de Roles',
    permissions: [
      { permission: Permission.VIEW_ROLES, label: 'Ver roles' },
      { permission: Permission.EDIT_ROLES, label: 'Editar roles' },
    ],
  },
  {
    name: 'Configuración del Sistema',
    permissions: [
      { permission: Permission.VIEW_SETTINGS, label: 'Ver configuración' },
      { permission: Permission.EDIT_SETTINGS, label: 'Editar configuración' },
    ],
  },
  {
    name: 'Gestión de Contenido',
    permissions: [
      { permission: Permission.VIEW_CONTENT, label: 'Ver contenido' },
      { permission: Permission.CREATE_CONTENT, label: 'Crear contenido' },
      { permission: Permission.EDIT_CONTENT, label: 'Editar contenido' },
      { permission: Permission.DELETE_CONTENT, label: 'Eliminar contenido' },
    ],
  },
  {
    name: 'Auditoría y Análisis',
    permissions: [
      { permission: Permission.VIEW_AUDIT_LOGS, label: 'Ver logs de auditoría' },
      { permission: Permission.VIEW_DASHBOARD, label: 'Ver dashboard' },
      { permission: Permission.VIEW_ANALYTICS, label: 'Ver análisis' },
    ],
  },
]

const ROLE_CONFIG: Record<UserRole, { label: string; badgeVariant: 'destructive' | 'default' | 'secondary' }> = {
  admin: { label: 'Administrador', badgeVariant: 'destructive' },
  moderator: { label: 'Moderador', badgeVariant: 'default' },
  user: { label: 'Usuario', badgeVariant: 'secondary' },
}

function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function PermissionsMatrix() {
  const roles: UserRole[] = ['admin', 'moderator', 'user']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Permisos</CardTitle>
        <CardDescription>
          Visualización completa de permisos por rol en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Permiso</TableHead>
                {roles.map((role) => (
                  <TableHead key={role} className="text-center">
                    <Badge variant={ROLE_CONFIG[role].badgeVariant}>
                      {ROLE_CONFIG[role].label}
                    </Badge>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_GROUPS.map((group, groupIndex) => (
                <>
                  <TableRow key={`group-${groupIndex}`} className="bg-muted/50">
                    <TableCell
                      colSpan={roles.length + 1}
                      className="font-semibold text-sm"
                    >
                      {group.name}
                    </TableCell>
                  </TableRow>
                  {group.permissions.map((item) => (
                    <TableRow key={item.permission}>
                      <TableCell className="font-medium pl-8">
                        {item.label}
                      </TableCell>
                      {roles.map((role) => (
                        <TableCell key={`${role}-${item.permission}`} className="text-center">
                          {hasPermission(role, item.permission) ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 inline-block" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground/30 inline-block" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
