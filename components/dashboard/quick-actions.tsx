/**
 * Quick Actions Component
 * Provides quick access to common admin tasks based on permissions
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UserPlus,
  Eye,
  Settings,
  BarChart3,
  LogOut,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import type { UserRole } from '@/lib/auth/types'

export interface QuickActionsProps {
  userRole?: UserRole
  canCreateUsers?: boolean
  canViewLogs?: boolean
  canManageSettings?: boolean
}

interface ActionItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href: string
  variant?: 'default' | 'outline'
  requiresRole?: UserRole[]
}

export function QuickActions({
  userRole = 'user',
  canCreateUsers = false,
  canViewLogs = false,
  canManageSettings = false,
}: QuickActionsProps) {
  const actions: ActionItem[] = [
    {
      id: 'view-users',
      label: 'Usuarios',
      description: 'Gestionar usuarios del sistema',
      icon: <Users className="w-5 h-5" />,
      href: '/admin/users',
    },
    {
      id: 'view-roles',
      label: 'Roles',
      description: 'Administrar roles y permisos',
      icon: <Users className="w-5 h-5" />,
      href: '/admin/roles',
    },
    {
      id: 'view-logs',
      label: 'Auditoría',
      description: 'Ver logs de actividad del sistema',
      icon: <Eye className="w-5 h-5" />,
      href: '/admin/audit-logs',
      requiresRole: ['admin', 'moderator'],
    },
    {
      id: 'view-analytics',
      label: 'Análitica',
      description: 'Ver analítica avanzada y reportes',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/admin/analytics',
      requiresRole: ['admin'],
    },
    {
      id: 'settings',
      label: 'Configuración',
      description: 'Configuración del sistema',
      icon: <Settings className="w-5 h-5" />,
      href: '/admin/settings',
      requiresRole: ['admin'],
    },
  ]

  // Filter actions based on role
  const visibleActions = actions.filter(action => {
    if (action.requiresRole) {
      return action.requiresRole.includes(userRole)
    }
    return true
  })

  if (visibleActions.length === 0) {
    return null
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visibleActions.map(action => (
          <Link key={action.id} href={action.href}>
            <Button
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center gap-3 p-4 group"
            >
              <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                {action.icon}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium leading-tight">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </p>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  )
}
