/**
 * Analytics Utilities
 *
 * Helper functions for date range handling, calculations, and formatting
 */

import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns'
import { format } from 'date-fns'
import type {
  DateRange,
  DateRangePreset,
  AnalyticsMetrics,
  MetricComparison,
} from '@/lib/types/analytics'

/**
 * Get date range from a preset
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date()

  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday':
      const yesterday = subDays(now, 1)
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) }
    case 'last7days':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
    case 'last30days':
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
    case 'last90days':
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) }
    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfDay(now) }
    case 'lastMonth':
      const lastMonth = subMonths(now, 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    default:
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
  }
}

/**
 * Get previous period for comparison
 * Calculates the same duration before the given date range
 */
export function getPreviousPeriod(dateRange: DateRange): DateRange {
  const diff = dateRange.to.getTime() - dateRange.from.getTime()
  const from = new Date(dateRange.from.getTime() - diff)
  const to = new Date(dateRange.to.getTime() - diff)
  return { from, to }
}

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Determine trend direction
 */
export function getTrend(
  current: number,
  previous: number
): 'up' | 'down' | 'stable' {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'stable'
}

/**
 * Calculate metric comparison
 */
export function calculateMetricComparison(
  current: number,
  previous: number
): MetricComparison {
  const percentage = calculateGrowthRate(current, previous)
  const trend = getTrend(current, previous)

  return {
    value: current - previous,
    percentage: Math.round(percentage * 100) / 100,
    trend,
  }
}

/**
 * Calculate comparison metrics between two periods
 */
export function calculateComparisonMetrics(
  current: AnalyticsMetrics,
  previous: AnalyticsMetrics
) {
  return {
    changes: {
      totalUsers: calculateMetricComparison(
        current.totalUsers,
        previous.totalUsers
      ),
      activeUsers: calculateMetricComparison(
        current.activeUsers,
        previous.activeUsers
      ),
      newUsers: calculateMetricComparison(
        current.newUsersMonth,
        previous.newUsersMonth
      ),
      actionsTotal: calculateMetricComparison(
        current.actionsMonth,
        previous.actionsMonth
      ),
      actionsPerUser: calculateMetricComparison(
        current.averageActionsPerUser,
        previous.averageActionsPerUser
      ),
    },
  }
}

/**
 * Format a date for display
 */
export function formatDateDisplay(date: Date): string {
  return format(date, 'dd MMM yyyy')
}

/**
 * Format a number for display
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(Math.round(num))
}

/**
 * Format a percentage
 */
export function formatPercentage(num: number, decimals = 1): string {
  return (Math.round(num * 10 ** decimals) / 10 ** decimals).toFixed(decimals) + '%'
}

/**
 * Format trend for display
 */
export function formatTrendDisplay(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return 'Aumento'
    case 'down':
      return 'Disminución'
    case 'stable':
      return 'Estable'
  }
}

/**
 * Get color for trend
 */
export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'stable':
      return 'text-gray-600'
  }
}

/**
 * Get trend icon
 */
export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '↑'
    case 'down':
      return '↓'
    case 'stable':
      return '→'
  }
}

/**
 * Convert date to ISO string (YYYY-MM-DD)
 */
export function dateToISOString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Parse ISO date string
 */
export function parseISODateString(str: string): Date {
  return new Date(str + 'T00:00:00Z')
}
