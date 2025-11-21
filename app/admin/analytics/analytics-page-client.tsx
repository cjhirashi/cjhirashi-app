'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  AlertCircle,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react'

import type {
  AnalyticsFilters,
  UserGrowthData,
  ActivityBreakdown,
  UserSegment,
  ActionTimelineData,
  TopUser,
} from '@/lib/types/analytics'

import {
  getDateRangeFromPreset,
  dateToISOString,
} from '@/lib/utils/analytics-utils'

import { AnalyticsFilters as AnalyticsFilterComponent } from '@/components/analytics/analytics-filters'
import { MetricsComparisonCard } from '@/components/analytics/metrics-comparison-card'
import { UserGrowthChart } from '@/components/analytics/user-growth-chart'
import { ActivityBreakdownChart } from '@/components/analytics/activity-breakdown-chart'
import { UserSegmentationChart } from '@/components/analytics/user-segmentation-chart'
import { ActionTimelineChart } from '@/components/analytics/action-timeline-chart'
import { TopUsersTable } from '@/components/analytics/top-users-table'
import { ExportReportButton } from '@/components/analytics/export-report-button'

interface MetricChange {
  value: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

interface AnalyticsMetricsWithChanges {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersWeek: number
  newUsersMonth: number
  growthRate: number
  actionsToday: number
  actionsWeek: number
  actionsMonth: number
  averageActionsPerUser: number
  changes?: Record<string, MetricChange>
  previous?: {
    totalUsers: number
    activeUsers: number
    newUsersToday: number
    newUsersWeek: number
    newUsersMonth: number
    growthRate: number
    actionsToday: number
    actionsWeek: number
    actionsMonth: number
    averageActionsPerUser: number
  }
}

interface AnalyticsData {
  metrics: AnalyticsMetricsWithChanges
  growth: UserGrowthData[]
  activity: ActivityBreakdown[]
  segmentation: {
    byRole: UserSegment[]
    byStatus: UserSegment[]
  }
  timeline: ActionTimelineData[]
  topUsers: TopUser[]
}

export function AnalyticsPageClient() {

  // State management
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    const defaultRange = getDateRangeFromPreset('last30days')
    return {
      dateRange: defaultRange,
      preset: 'last30days',
    }
  })

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = async (filtersToFetch: AnalyticsFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      const from = dateToISOString(filtersToFetch.dateRange.from)
      const to = dateToISOString(filtersToFetch.dateRange.to)
      const compareWith = filtersToFetch.compareWith ? 'true' : 'false'

      // Fetch all endpoints in parallel
      const [metricsRes, growthRes, activityRes, segmentationRes, timelineRes, topUsersRes] =
        await Promise.all([
          fetch(
            `/api/admin/analytics/metrics?from=${from}&to=${to}&compareWith=${compareWith}`
          ),
          fetch(
            `/api/admin/analytics/growth?from=${from}&to=${to}`
          ),
          fetch(
            `/api/admin/analytics/activity?from=${from}&to=${to}`
          ),
          fetch('/api/admin/analytics/segmentation'),
          fetch(
            `/api/admin/analytics/timeline?from=${from}&to=${to}&interval=day`
          ),
          fetch(
            `/api/admin/analytics/top-users?from=${from}&to=${to}&limit=10`
          ),
        ])

      // Check all responses
      if (
        !metricsRes.ok ||
        !growthRes.ok ||
        !activityRes.ok ||
        !segmentationRes.ok ||
        !timelineRes.ok ||
        !topUsersRes.ok
      ) {
        throw new Error('Failed to fetch analytics data')
      }

      // Parse responses
      const [metricsData, growthData, activityData, segmentationData, timelineData, topUsersData] =
        await Promise.all([
          metricsRes.json(),
          growthRes.json(),
          activityRes.json(),
          segmentationRes.json(),
          timelineRes.json(),
          topUsersRes.json(),
        ])

      setData({
        metrics: metricsData.current || metricsData,
        growth: growthData.data || [],
        activity: activityData.data || [],
        segmentation: segmentationData,
        timeline: timelineData.data || [],
        topUsers: topUsersData.data || [],
      })

      // Update metrics with comparison if requested
      if (filtersToFetch.compareWith && metricsData.changes) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                metrics: {
                  ...prev.metrics,
                  changes: metricsData.changes,
                  previous: metricsData.previous,
                },
              }
            : prev
        )
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Error al cargar datos de analytics')
      toast.error('Error al cargar datos de analytics')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateRange.from, filters.dateRange.to, filters.preset, filters.compareWith])

  // Handle filter changes
  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
    fetchAnalyticsData(newFilters)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics y Estadísticas
          </h1>
          <p className="text-muted-foreground mt-2">
            Análisis detallado de usuarios, actividad y crecimiento del sistema
          </p>
        </div>
        <ExportReportButton filters={filters} />
      </div>

      {/* Filters */}
      <AnalyticsFilterComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Metrics Skeleton */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>

          {/* Charts Skeleton */}
          <Skeleton className="h-80" />
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Main Metrics Grid */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métricas Principales
            </h2>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <MetricsComparisonCard
                title="Total Usuarios"
                currentValue={data.metrics.totalUsers}
                previousValue={data.metrics.previous?.totalUsers}
                format="number"
                icon={<Users className="h-5 w-5" />}
                comparison={
                  data.metrics.changes?.totalUsers
                    ? {
                        value: data.metrics.changes.totalUsers.value,
                        percentage:
                          data.metrics.changes.totalUsers.percentage,
                        trend: data.metrics.changes.totalUsers.trend,
                      }
                    : undefined
                }
                variant="info"
              />

              <MetricsComparisonCard
                title="Usuarios Activos"
                currentValue={data.metrics.activeUsers}
                previousValue={data.metrics.previous?.activeUsers}
                format="number"
                icon={<Activity className="h-5 w-5" />}
                comparison={
                  data.metrics.changes?.activeUsers
                    ? {
                        value: data.metrics.changes.activeUsers.value,
                        percentage:
                          data.metrics.changes.activeUsers.percentage,
                        trend: data.metrics.changes.activeUsers.trend,
                      }
                    : undefined
                }
                variant="success"
              />

              <MetricsComparisonCard
                title="Nuevos Usuarios"
                currentValue={data.metrics.newUsersMonth}
                previousValue={data.metrics.previous?.newUsersMonth}
                format="number"
                icon={<Users className="h-5 w-5" />}
                comparison={
                  data.metrics.changes?.newUsers
                    ? {
                        value: data.metrics.changes.newUsers.value,
                        percentage: data.metrics.changes.newUsers.percentage,
                        trend: data.metrics.changes.newUsers.trend,
                      }
                    : undefined
                }
                variant="warning"
              />

              <MetricsComparisonCard
                title="Total Acciones"
                currentValue={data.metrics.actionsMonth}
                previousValue={data.metrics.previous?.actionsMonth}
                format="number"
                icon={<BarChart3 className="h-5 w-5" />}
                comparison={
                  data.metrics.changes?.actionsTotal
                    ? {
                        value: data.metrics.changes.actionsTotal.value,
                        percentage:
                          data.metrics.changes.actionsTotal.percentage,
                        trend: data.metrics.changes.actionsTotal.trend,
                      }
                    : undefined
                }
              />
            </div>
          </section>

          {/* User Growth Chart */}
          <section>
            <UserGrowthChart data={data.growth} height={350} />
          </section>

          {/* Activity and Segmentation Charts */}
          <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <ActivityBreakdownChart data={data.activity} />
            <div className="space-y-6">
              <UserSegmentationChart
                data={data.segmentation.byRole}
                title="Usuarios por Rol"
                barColor="#3b82f6"
              />
            </div>
          </section>

          {/* Status Segmentation */}
          <section>
            <UserSegmentationChart
              data={data.segmentation.byStatus}
              title="Usuarios por Estado"
              barColor="#10b981"
              height={250}
            />
          </section>

          {/* Action Timeline */}
          <section>
            <ActionTimelineChart data={data.timeline} interval="day" />
          </section>

          {/* Top Users Table */}
          <section>
            <TopUsersTable users={data.topUsers} />
          </section>
        </>
      ) : null}
    </div>
  )
}
