/**
 * Database Views Helper Functions
 *
 * Prisma doesn't natively support materialized views, so we use raw SQL queries
 * for the analytics views created in our migrations.
 */

import { prisma } from './prisma'

/**
 * Dashboard Statistics
 * From: admin_dashboard_stats materialized view
 */
export interface DashboardStats {
  total_users: bigint
  active_users: bigint
  inactive_users: bigint
  suspended_users: bigint
  pending_users: bigint
  new_users_today: bigint
  new_users_week: bigint
  new_users_month: bigint
  total_admins: bigint
  total_moderators: bigint
  total_regular_users: bigint
  actions_today: bigint
  actions_week: bigint
  refreshed_at: Date
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const result = await prisma.$queryRaw<DashboardStats[]>`
    SELECT
      total_users,
      active_users,
      inactive_users,
      suspended_users,
      pending_users,
      new_users_today,
      new_users_week,
      new_users_month,
      total_admins,
      total_moderators,
      total_regular_users,
      actions_today,
      actions_week,
      refreshed_at
    FROM admin_dashboard_stats
    LIMIT 1
  `

  return result[0] || {
    total_users: BigInt(0),
    active_users: BigInt(0),
    inactive_users: BigInt(0),
    suspended_users: BigInt(0),
    pending_users: BigInt(0),
    new_users_today: BigInt(0),
    new_users_week: BigInt(0),
    new_users_month: BigInt(0),
    total_admins: BigInt(0),
    total_moderators: BigInt(0),
    total_regular_users: BigInt(0),
    actions_today: BigInt(0),
    actions_week: BigInt(0),
    refreshed_at: new Date(),
  }
}

/**
 * Recent Activity
 * From: recent_activity view
 */
export interface RecentActivity {
  id: string
  action: string
  action_category: string
  resource_type: string | null
  resource_id: string | null
  created_at: Date
  user_email: string | null
  user_name: string | null
  user_role: string | null
}

export async function getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
  const result = await prisma.$queryRaw<RecentActivity[]>`
    SELECT
      id,
      action,
      action_category,
      resource_type,
      resource_id,
      created_at,
      user_email,
      user_name,
      user_role
    FROM recent_activity
    LIMIT ${limit}
  `

  return result
}

/**
 * User Activity Summary
 * From: user_activity_summary view
 */
export interface UserActivitySummary {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  status: string | null
  last_login_at: Date | null
  user_since: Date
  total_actions: bigint
  actions_today: bigint
  actions_week: bigint
  actions_month: bigint
}

export async function getUserActivitySummary(limit: number = 100): Promise<UserActivitySummary[]> {
  const result = await prisma.$queryRaw<UserActivitySummary[]>`
    SELECT
      id,
      full_name,
      email,
      role,
      status,
      last_login_at,
      user_since,
      total_actions,
      actions_today,
      actions_week,
      actions_month
    FROM user_activity_summary
    ORDER BY total_actions DESC
    LIMIT ${limit}
  `

  return result
}

export async function getUserActivityById(userId: string): Promise<UserActivitySummary | null> {
  const result = await prisma.$queryRaw<UserActivitySummary[]>`
    SELECT
      id,
      full_name,
      email,
      role,
      status,
      last_login_at,
      user_since,
      total_actions,
      actions_today,
      actions_week,
      actions_month
    FROM user_activity_summary
    WHERE id = ${userId}::uuid
    LIMIT 1
  `

  return result[0] || null
}

/**
 * Refresh the materialized view
 * Should be called periodically (e.g., via a cron job or webhook)
 */
export async function refreshDashboardStats(): Promise<void> {
  await prisma.$executeRaw`
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats
  `
}
