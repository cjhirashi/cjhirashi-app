'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, CheckCircle2 } from 'lucide-react'
import type { UserRole } from '@/lib/auth/types'
import { ROLE_PERMISSIONS } from '@/lib/auth/types'

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string
    icon: React.ReactNode
    badgeVariant: 'destructive' | 'default' | 'secondary'
    description: string
  }
> = {
  admin: {
    label: 'Administrador',
    icon: <Shield className="h-5 w-5" />,
    badgeVariant: 'destructive',
    description: 'Acceso completo al sistema',
  },
  moderator: {
    label: 'Moderador',
    icon: <Shield className="h-5 w-5" />,
    badgeVariant: 'default',
    description: 'Gestión de usuarios y contenido',
  },
  user: {
    label: 'Usuario',
    icon: <Shield className="h-5 w-5" />,
    badgeVariant: 'secondary',
    description: 'Acceso básico al sistema',
  },
}

interface RoleCardProps {
  role: UserRole
  userCount: number
  onViewDetails: (role: UserRole) => void
}

export function RoleCard({ role, userCount, onViewDetails }: RoleCardProps) {
  const config = ROLE_CONFIG[role]
  const permissionsCount = ROLE_PERMISSIONS[role].length

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
            <CardTitle className="text-xl">{config.label}</CardTitle>
          </div>
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{userCount}</p>
              <p className="text-xs text-muted-foreground">
                {userCount === 1 ? 'Usuario' : 'Usuarios'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{permissionsCount}</p>
              <p className="text-xs text-muted-foreground">
                {permissionsCount === 1 ? 'Permiso' : 'Permisos'}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onViewDetails(role)}
        >
          Ver detalles
        </Button>
      </CardContent>
    </Card>
  )
}
