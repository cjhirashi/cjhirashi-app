/**
 * GET /api/admin/analytics/metrics
 *
 * Fetch analytics metrics for a date range with optional comparison
 * Requires: VIEW_ANALYTICS permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { requirePermission, Permission } from '@/lib/auth/server'
import {
  getAnalyticsMetrics,
} from '@/lib/db/analytics-helpers'
import { getPreviousPeriod } from '@/lib/utils/analytics-utils'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and permission
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      await requirePermission(Permission.VIEW_ANALYTICS)
    } catch {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const compareWithParam = searchParams.get('compareWith') === 'true'

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Missing date range parameters' },
        { status: 400 }
      )
    }

    const from = new Date(fromParam)
    const to = new Date(toParam)

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get metrics for current period
    const currentMetrics = await getAnalyticsMetrics({
      from,
      to,
    })

    // Get metrics for previous period if requested
    interface MetricsResponse {
      current: typeof currentMetrics
      previous?: typeof currentMetrics
      changes?: Record<string, {
        value: number
        percentage: number
        trend: 'up' | 'down' | 'stable'
      }>
    }

    let response: MetricsResponse = {
      current: currentMetrics,
    }

    if (compareWithParam) {
      const previousPeriod = getPreviousPeriod({ from, to })
      const previousMetrics = await getAnalyticsMetrics(previousPeriod)

      response = {
        current: currentMetrics,
        previous: previousMetrics,
        changes: {
          totalUsers: {
            value: currentMetrics.totalUsers - previousMetrics.totalUsers,
            percentage:
              previousMetrics.totalUsers > 0
                ? Math.round(
                    ((currentMetrics.totalUsers - previousMetrics.totalUsers) /
                      previousMetrics.totalUsers) *
                      10000
                  ) / 100
                : currentMetrics.totalUsers > 0
                  ? 100
                  : 0,
            trend:
              currentMetrics.totalUsers > previousMetrics.totalUsers
                ? 'up'
                : currentMetrics.totalUsers < previousMetrics.totalUsers
                  ? 'down'
                  : 'stable',
          },
          activeUsers: {
            value: currentMetrics.activeUsers - previousMetrics.activeUsers,
            percentage:
              previousMetrics.activeUsers > 0
                ? Math.round(
                    ((currentMetrics.activeUsers - previousMetrics.activeUsers) /
                      previousMetrics.activeUsers) *
                      10000
                  ) / 100
                : currentMetrics.activeUsers > 0
                  ? 100
                  : 0,
            trend:
              currentMetrics.activeUsers > previousMetrics.activeUsers
                ? 'up'
                : currentMetrics.activeUsers < previousMetrics.activeUsers
                  ? 'down'
                  : 'stable',
          },
          newUsers: {
            value: currentMetrics.newUsersMonth - previousMetrics.newUsersMonth,
            percentage:
              previousMetrics.newUsersMonth > 0
                ? Math.round(
                    ((currentMetrics.newUsersMonth - previousMetrics.newUsersMonth) /
                      previousMetrics.newUsersMonth) *
                      10000
                  ) / 100
                : currentMetrics.newUsersMonth > 0
                  ? 100
                  : 0,
            trend:
              currentMetrics.newUsersMonth > previousMetrics.newUsersMonth
                ? 'up'
                : currentMetrics.newUsersMonth < previousMetrics.newUsersMonth
                  ? 'down'
                  : 'stable',
          },
          actionsTotal: {
            value: currentMetrics.actionsMonth - previousMetrics.actionsMonth,
            percentage:
              previousMetrics.actionsMonth > 0
                ? Math.round(
                    ((currentMetrics.actionsMonth - previousMetrics.actionsMonth) /
                      previousMetrics.actionsMonth) *
                      10000
                  ) / 100
                : currentMetrics.actionsMonth > 0
                  ? 100
                  : 0,
            trend:
              currentMetrics.actionsMonth > previousMetrics.actionsMonth
                ? 'up'
                : currentMetrics.actionsMonth < previousMetrics.actionsMonth
                  ? 'down'
                  : 'stable',
          },
          actionsPerUser: {
            value:
              currentMetrics.averageActionsPerUser -
              previousMetrics.averageActionsPerUser,
            percentage:
              previousMetrics.averageActionsPerUser > 0
                ? Math.round(
                    ((currentMetrics.averageActionsPerUser -
                      previousMetrics.averageActionsPerUser) /
                      previousMetrics.averageActionsPerUser) *
                      10000
                  ) / 100
                : currentMetrics.averageActionsPerUser > 0
                  ? 100
                  : 0,
            trend:
              currentMetrics.averageActionsPerUser >
              previousMetrics.averageActionsPerUser
                ? 'up'
                : currentMetrics.averageActionsPerUser <
                    previousMetrics.averageActionsPerUser
                  ? 'down'
                  : 'stable',
          },
        },
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
