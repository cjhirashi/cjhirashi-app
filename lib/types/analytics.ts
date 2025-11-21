/**
 * Analytics Types
 *
 * Type definitions for analytics and statistics reporting
 */

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom'

export interface DateRange {
  from?: Date
  to?: Date
}

export interface AnalyticsFilters {
  dateRange: DateRange
  preset: DateRangePreset
  compareWith?: DateRange
}

export interface UserGrowthData {
  date: string // YYYY-MM-DD
  newUsers: number
  totalUsers: number
  activeUsers: number
}

export interface ActivityBreakdown {
  category: string
  count: number
  percentage: number
}

export interface UserSegment {
  segment: string // role, status, etc.
  count: number
  percentage: number
}

export interface AnalyticsMetrics {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersWeek: number
  newUsersMonth: number
  growthRate: number // Percentage
  actionsToday: number
  actionsWeek: number
  actionsMonth: number
  averageActionsPerUser: number
}

export interface MetricComparison {
  value: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface ComparisonMetrics {
  current: AnalyticsMetrics
  previous: AnalyticsMetrics
  changes: {
    [key: string]: MetricComparison
  }
}

export interface ActionTimelineData {
  date: string // For hour: HH:00, for day: YYYY-MM-DD
  count: number
}

export interface TopUser {
  id: string
  fullName: string | null
  email: string | null
  role: string | null
  actionCount: number
  lastActionAt: Date | null
}
