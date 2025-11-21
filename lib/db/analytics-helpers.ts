/**
 * Analytics Database Helpers
 *
 * Functions for fetching analytics data from the database
 */

import { prisma } from './prisma'
import type {
  AnalyticsMetrics,
  UserGrowthData,
  ActivityBreakdown,
  UserSegment,
  ActionTimelineData,
  TopUser,
  DateRange,
} from '@/lib/types/analytics'

/**
 * Get analytics metrics for a date range
 */
export async function getAnalyticsMetrics(
  dateRange: DateRange
): Promise<AnalyticsMetrics> {
  const { from, to } = dateRange

  // Get data for the specified period
  const [
    totalUsers,
    activeUsers,
    newUsersInPeriod,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    actionsInPeriod,
    actionsToday,
    actionsWeek,
    actionsMonth,
  ] = await Promise.all([
    // Total users (all time)
    prisma.user_profiles.count(),

    // Active users
    prisma.user_profiles.count({
      where: { status: 'active' },
    }),

    // New users in period
    prisma.user_profiles.count({
      where: {
        created_at: {
          gte: from,
          lte: to,
        },
      },
    }),

    // New users today
    prisma.user_profiles.count({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),

    // New users last 7 days
    prisma.user_profiles.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // New users last 30 days
    prisma.user_profiles.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Actions in period
    prisma.audit_logs.count({
      where: {
        created_at: {
          gte: from,
          lte: to,
        },
      },
    }),

    // Actions today
    prisma.audit_logs.count({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),

    // Actions last 7 days
    prisma.audit_logs.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Actions last 30 days
    prisma.audit_logs.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  // Calculate growth rate (new users in period / total users * 100)
  const growthRate =
    totalUsers > 0 ? (newUsersInPeriod / totalUsers) * 100 : 0

  // Calculate average actions per user
  const averageActionsPerUser =
    totalUsers > 0 ? actionsInPeriod / totalUsers : 0

  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    growthRate: Math.round(growthRate * 100) / 100,
    actionsToday,
    actionsWeek,
    actionsMonth,
    averageActionsPerUser:
      Math.round(averageActionsPerUser * 100) / 100,
  }
}

/**
 * Get user growth data for a date range (day by day)
 */
export async function getUserGrowthData(
  dateRange: DateRange
): Promise<UserGrowthData[]> {
  const { from, to } = dateRange

  const result = await prisma.$queryRaw<
    Array<{
      date: string
      new_users: bigint
      total_users: bigint
      active_users: bigint
    }>
  >`
    WITH date_series AS (
      SELECT generate_series(${from}::date, ${to}::date, '1 day'::interval)::date AS date
    ),
    daily_new_users AS (
      SELECT
        DATE(created_at) as date,
        COUNT(*) as new_count
      FROM public.user_profiles
      WHERE created_at >= ${from} AND created_at <= ${to}
      GROUP BY DATE(created_at)
    ),
    daily_active_users AS (
      SELECT
        DATE(last_login_at) as date,
        COUNT(*) as active_count
      FROM public.user_profiles
      WHERE last_login_at >= ${from} AND last_login_at <= ${to}
        AND status = 'active'
      GROUP BY DATE(last_login_at)
    ),
    cumulative_users AS (
      SELECT
        ds.date,
        COALESCE(dnu.new_count, 0) as new_users,
        SUM(COALESCE(dnu.new_count, 0)) OVER (ORDER BY ds.date) as total_new
      FROM date_series ds
      LEFT JOIN daily_new_users dnu ON ds.date = dnu.date
    )
    SELECT
      cu.date::text,
      cu.new_users::bigint,
      (
        (SELECT COUNT(*) FROM public.user_profiles WHERE created_at <= cu.date)
      )::bigint as total_users,
      COALESCE(dau.active_count, 0)::bigint as active_users
    FROM cumulative_users cu
    LEFT JOIN daily_active_users dau ON cu.date = dau.date
    ORDER BY cu.date
  `

  return result.map((row) => ({
    date: row.date,
    newUsers: Number(row.new_users),
    totalUsers: Number(row.total_users),
    activeUsers: Number(row.active_users),
  }))
}

/**
 * Get activity breakdown by category
 */
export async function getActivityBreakdown(
  dateRange: DateRange
): Promise<ActivityBreakdown[]> {
  const { from, to } = dateRange

  const result = await prisma.$queryRaw<
    Array<{
      category: string
      count: bigint
    }>
  >`
    SELECT
      action_category as category,
      COUNT(*) as count
    FROM public.audit_logs
    WHERE created_at >= ${from} AND created_at <= ${to}
    GROUP BY action_category
    ORDER BY count DESC
  `

  const total = result.reduce((sum, row) => sum + Number(row.count), 0)

  return result.map((row) => ({
    category: row.category || 'Otro',
    count: Number(row.count),
    percentage:
      total > 0
        ? Math.round((Number(row.count) / total) * 10000) / 100
        : 0,
  }))
}

/**
 * Get user segmentation by role and status
 */
export async function getUserSegmentation(): Promise<{
  byRole: UserSegment[]
  byStatus: UserSegment[]
}> {
  const [roleResults, statusResults] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        role: string
        count: bigint
      }>
    >`
      SELECT
        role,
        COUNT(*) as count
      FROM public.user_roles
      GROUP BY role
      ORDER BY count DESC
    `,

    prisma.$queryRaw<
      Array<{
        status: string
        count: bigint
      }>
    >`
      SELECT
        status,
        COUNT(*) as count
      FROM public.user_profiles
      GROUP BY status
      ORDER BY count DESC
    `,
  ])

  const totalByRole = roleResults.reduce(
    (sum, row) => sum + Number(row.count),
    0
  )
  const totalByStatus = statusResults.reduce(
    (sum, row) => sum + Number(row.count),
    0
  )

  return {
    byRole: roleResults.map((row) => ({
      segment: row.role || 'Unknown',
      count: Number(row.count),
      percentage:
        totalByRole > 0
          ? Math.round((Number(row.count) / totalByRole) * 10000) / 100
          : 0,
    })),
    byStatus: statusResults.map((row) => ({
      segment: row.status || 'Unknown',
      count: Number(row.count),
      percentage:
        totalByStatus > 0
          ? Math.round((Number(row.count) / totalByStatus) * 10000) / 100
          : 0,
    })),
  }
}

/**
 * Get top active users
 */
export async function getTopActiveUsers(
  dateRange: DateRange,
  limit: number = 10
): Promise<TopUser[]> {
  const { from, to } = dateRange

  const result = await prisma.$queryRaw<
    Array<{
      id: string
      full_name: string | null
      email: string
      role: string
      action_count: bigint
      last_action_at: Date | null
    }>
  >`
    SELECT
      u.id,
      up.full_name,
      u.email,
      ur.role,
      COUNT(al.id) as action_count,
      MAX(al.created_at) as last_action_at
    FROM auth.users u
    JOIN public.user_profiles up ON up.user_id = u.id
    JOIN public.user_roles ur ON ur.user_id = u.id
    LEFT JOIN public.audit_logs al ON al.user_id = u.id
      AND al.created_at >= ${from}
      AND al.created_at <= ${to}
    GROUP BY u.id, up.full_name, u.email, ur.role
    HAVING COUNT(al.id) > 0
    ORDER BY action_count DESC
    LIMIT ${limit}
  `

  return result.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    actionCount: Number(row.action_count),
    lastActionAt: row.last_action_at,
  }))
}

/**
 * Get action timeline
 */
export async function getActionTimeline(
  dateRange: DateRange,
  interval: 'hour' | 'day' = 'day'
): Promise<ActionTimelineData[]> {
  const { from, to } = dateRange

  const timeFormat =
    interval === 'hour' ? 'YYYY-MM-DD HH:00' : 'YYYY-MM-DD'
  const intervalStr = interval === 'hour' ? '1 hour' : '1 day'

  const result = await prisma.$queryRaw<
    Array<{
      date: string
      count: bigint
    }>
  >`
    WITH date_series AS (
      SELECT generate_series(${from}, ${to}, INTERVAL '${prisma.$raw(intervalStr)}') as ts
    )
    SELECT
      to_char(ds.ts, ${timeFormat}) as date,
      COALESCE(COUNT(al.id), 0) as count
    FROM date_series ds
    LEFT JOIN public.audit_logs al ON
      DATE_TRUNC(${prisma.$raw(`'${interval}'`)}, al.created_at) = DATE_TRUNC(${prisma.$raw(`'${interval}'`)}, ds.ts)
    GROUP BY DATE_TRUNC(${prisma.$raw(`'${interval}'`)}, ds.ts)
    ORDER BY ds.ts
  `

  return result.map((row) => ({
    date: row.date,
    count: Number(row.count),
  }))
}
