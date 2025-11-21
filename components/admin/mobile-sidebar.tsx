'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  BarChart,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { NavItem } from './nav-item'
import { useUser, usePermission, Permission } from '@/lib/auth/client'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { user, loading } = useUser()

  // Permission checks
  const canViewUsers = usePermission(Permission.VIEW_USERS)
  const canCreateUsers = usePermission(Permission.CREATE_USERS)
  const canViewRoles = usePermission(Permission.VIEW_ROLES)
  const canViewAuditLogs = usePermission(Permission.VIEW_AUDIT_LOGS)
  const canViewSettings = usePermission(Permission.VIEW_SETTINGS)
  const canViewAnalytics = usePermission(Permission.VIEW_ANALYTICS)

  // Role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'moderator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b p-4">
            <SheetTitle asChild>
              <Link
                href="/admin"
                className="flex items-center gap-2"
                onClick={() => onOpenChange(false)}
              >
                <LayoutDashboard className="h-6 w-6" />
                <span className="font-semibold">Admin Panel</span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1" onClick={() => onOpenChange(false)}>
              {/* Dashboard - Always visible */}
              <NavItem
                href="/admin"
                icon={LayoutDashboard}
                label="Dashboard"
                visible={true}
              />

              {/* Users */}
              <NavItem
                href="/admin/users"
                icon={Users}
                label="Usuarios"
                visible={canViewUsers}
                subItems={[
                  {
                    href: '/admin/users',
                    label: 'Lista',
                    visible: canViewUsers,
                  },
                  {
                    href: '/admin/users/new',
                    label: 'Nuevo Usuario',
                    visible: canCreateUsers,
                  },
                ]}
              />

              {/* Roles */}
              <NavItem
                href="/admin/roles"
                icon={Shield}
                label="Roles"
                visible={canViewRoles}
              />

              {/* Audit Logs */}
              <NavItem
                href="/admin/audit-logs"
                icon={FileText}
                label="Logs de Actividad"
                visible={canViewAuditLogs}
              />

              {/* Analytics */}
              <NavItem
                href="/admin/analytics"
                icon={BarChart}
                label="Analytics"
                visible={canViewAnalytics}
              />

              <Separator className="my-3" />

              {/* Settings - Admin only */}
              <NavItem
                href="/admin/settings"
                icon={Settings}
                label="Configuración"
                visible={canViewSettings}
              />
            </nav>
          </ScrollArea>

          {/* Footer with User Role */}
          {user && !loading && (
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rol:</span>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              {user.status !== 'active' && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {user.status}
                  </Badge>
                </div>
              )}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">v1.0.0</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
