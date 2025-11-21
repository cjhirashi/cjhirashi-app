'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  BarChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { NavItem } from './nav-item'
import { useUser, usePermission, Permission } from '@/lib/auth/client'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, loading } = useUser()

  // Permission checks
  const canViewUsers = usePermission(Permission.VIEW_USERS)
  const canCreateUsers = usePermission(Permission.CREATE_USERS)
  const canViewRoles = usePermission(Permission.VIEW_ROLES)
  const canViewAuditLogs = usePermission(Permission.VIEW_AUDIT_LOGS)
  const canViewSettings = usePermission(Permission.VIEW_SETTINGS)
  const canViewAnalytics = usePermission(Permission.VIEW_ANALYTICS)

  // Loading state
  if (loading) {
    return (
      <aside
        className={cn(
          'flex h-screen flex-col border-r bg-background',
          collapsed ? 'w-16' : 'w-64',
          'transition-all duration-300',
          className
        )}
      >
        <div className="flex h-14 items-center justify-center border-b px-4">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        </div>
      </aside>
    )
  }

  // Role badge color
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
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-background',
        collapsed ? 'w-16' : 'w-64',
        'transition-all duration-300',
        className
      )}
    >
      {/* Header with Logo/Title */}
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed ? (
          <Link href="/admin" className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            <span className="font-semibold">Admin Panel</span>
          </Link>
        ) : (
          <Link href="/admin" className="flex w-full justify-center">
            <LayoutDashboard className="h-6 w-6" />
          </Link>
        )}
      </div>

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {/* Dashboard - Always visible */}
          <NavItem
            href="/admin"
            icon={LayoutDashboard}
            label="Dashboard"
            collapsed={collapsed}
            visible={true}
          />

          {/* Users */}
          <NavItem
            href="/admin/users"
            icon={Users}
            label="Usuarios"
            collapsed={collapsed}
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
            collapsed={collapsed}
            visible={canViewRoles}
          />

          {/* Audit Logs */}
          <NavItem
            href="/admin/audit-logs"
            icon={FileText}
            label="Logs de Actividad"
            collapsed={collapsed}
            visible={canViewAuditLogs}
          />

          {/* Analytics */}
          <NavItem
            href="/admin/analytics"
            icon={BarChart}
            label="Analytics"
            collapsed={collapsed}
            visible={canViewAnalytics}
          />

          <Separator className="my-3" />

          {/* Settings - Admin only */}
          <NavItem
            href="/admin/settings"
            icon={Settings}
            label="Configuración"
            collapsed={collapsed}
            visible={canViewSettings}
          />
        </nav>
      </ScrollArea>

      {/* Footer with User Role and Collapse Toggle */}
      <div className="border-t">
        {/* User Role Badge */}
        {user && !collapsed && (
          <div className="px-4 py-3">
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
          </div>
        )}

        {/* Collapse Toggle Button */}
        <div className="p-2">
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            className={cn('w-full', collapsed && 'h-9 w-9')}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-2">Colapsar</span>
              </>
            )}
          </Button>
        </div>

        {/* Version Info */}
        {!collapsed && (
          <div className="border-t px-4 py-2">
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  )
}
