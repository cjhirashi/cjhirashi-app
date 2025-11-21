/**
 * Admin Dashboard Home Page
 * Protected by middleware - only accessible to admin and moderator roles
 *
 * Displays comprehensive dashboard with:
 * - Key statistics and metrics
 * - User status and role distribution charts
 * - Recent activity feed
 * - Most active users
 * - System status
 * - Quick action buttons
 */

import { getCurrentUser, requireModerator, getUserRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import {
  getDashboardStats,
  getRecentActivity,
  getUserActivitySummary,
} from '@/lib/db/views'
import {
  StatsCard,
  UserStatusChart,
  RoleDistributionChart,
  RecentActivityTable,
  TopUsersList,
  SystemStatusCard,
  QuickActions,
} from '@/components/dashboard'
import {
  Users,
  UserCheck,
  Shield,
  Activity,
  TrendingUp,
  Calendar,
} from 'lucide-react'

export default async function AdminPage() {
  // Require moderator or admin access
  try {
    await requireModerator()
  } catch {
    redirect('/unauthorized')
  }

  // Fetch all data in parallel
  const [user, stats, recentActivity, topUsers] = await Promise.all([
    getCurrentUser(),
    getDashboardStats(),
    getRecentActivity(10),
    getUserActivitySummary(5),
  ])

  if (!user) {
    redirect('/unauthorized')
  }

  // Calculate trends (simplified - compare with previous data would require more logic)
  const totalUsersValue = Number(stats.total_users)
  const activeUsersValue = Number(stats.active_users)
  const activePercentage =
    totalUsersValue > 0
      ? Math.round((activeUsersValue / totalUsersValue) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido, {user.email}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatsCard
          title="Total Usuarios"
          value={totalUsersValue.toLocaleString('es-ES')}
          description="Usuarios registrados en el sistema"
          icon={Users}
          variant="info"
          trend={{
            value: Number(stats.new_users_month),
            isPositive: true,
            label: 'Nuevos este mes',
          }}
        />

        <StatsCard
          title="Usuarios Activos"
          value={activeUsersValue.toLocaleString('es-ES')}
          description={`${activePercentage}% del total`}
          icon={UserCheck}
          variant="success"
          trend={{
            value: Math.min(
              100,
              activePercentage > 80
                ? 5
                : activePercentage > 60
                  ? 0
                  : -5
            ),
            isPositive: activePercentage > 80,
            label: 'Porcentaje activo',
          }}
        />

        <StatsCard
          title="Administradores"
          value={Number(stats.total_admins).toString()}
          description={`${Number(stats.total_moderators)} moderadores`}
          icon={Shield}
          variant="warning"
        />

        <StatsCard
          title="Acciones Hoy"
          value={Number(stats.actions_today).toLocaleString('es-ES')}
          description={`${Number(stats.actions_week)} esta semana`}
          icon={Activity}
          variant="default"
          trend={{
            value: Math.round(
              (Number(stats.actions_today) / Math.max(1, Number(stats.actions_week) / 7)) *
                100 -
                100
            ),
            isPositive:
              Number(stats.actions_today) >=
              Number(stats.actions_week) / 7,
            label: 'vs. promedio diario',
          }}
        />

        <StatsCard
          title="Nuevos Usuarios (Mes)"
          value={Number(stats.new_users_month).toString()}
          description={`${Number(stats.new_users_week)} esta semana`}
          icon={TrendingUp}
          variant="info"
        />

        <StatsCard
          title="Acciones Semana"
          value={Number(stats.actions_week).toLocaleString('es-ES')}
          description={`${(Number(stats.actions_week) / 7).toFixed(0)} por día`}
          icon={Calendar}
          variant="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserStatusChart stats={stats} />
        <RoleDistributionChart stats={stats} />
      </div>

      {/* Activity and Top Users Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivityTable activities={recentActivity} />
        <div className="space-y-6">
          <TopUsersList users={topUsers} />
          <SystemStatusCard stats={stats} appVersion="1.0.0" />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions userRole={user.role} />
    </div>
  )
}
