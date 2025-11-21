/**
 * Example Usage of Prisma Client
 *
 * This file demonstrates how to use Prisma Client in different scenarios.
 * These are examples only - remove or adapt for your actual implementation.
 */

import { prisma } from './prisma'
import {
  getUserWithProfile,
  getUsersByRole,
  updateUserRole,
  updateUserStatus,
  createAuditLog,
  getAuditLogs,
  getSystemSetting,
  updateSystemSetting,
  isUserAdmin,
} from './helpers'
import {
  getDashboardStats,
  getRecentActivity,
  getUserActivitySummary,
  refreshDashboardStats,
} from './views'

/**
 * Example 1: Direct Prisma Queries
 */
export async function exampleDirectQueries() {
  // Get all user roles
  const allUserRoles = await prisma.user_roles.findMany()

  // Get a specific user's profile
  const userId = 'some-uuid'
  const userProfile = await prisma.user_profiles.findUnique({
    where: { user_id: userId },
  })

  // Create an audit log
  await prisma.audit_logs.create({
    data: {
      user_id: userId,
      action: 'user.login',
      action_category: 'auth',
      metadata: { description: 'User logged in successfully' },
      ip_address: '192.168.1.1',
    },
  })

  // Get system settings
  const settings = await prisma.system_settings.findMany()

  return { allUserRoles, userProfile, settings }
}

/**
 * Example 2: Using Helper Functions
 */
export async function exampleHelperFunctions() {
  const userId = 'some-uuid'
  const adminId = 'admin-uuid'

  // Check if user is admin
  const isAdmin = await isUserAdmin(userId)

  // Get user with profile
  const user = await getUserWithProfile(userId)

  // Get all admins
  const admins = await getUsersByRole('admin')

  // Update user role
  await updateUserRole(userId, 'moderator', adminId)

  // Update user status
  await updateUserStatus(userId, 'active')

  // Create audit log using helper
  await createAuditLog({
    user_id: adminId,
    action: 'user.role_updated',
    category: 'user',
    entity_type: 'user',
    entity_id: userId,
    description: 'Updated user role to moderator',
    metadata: {
      previous_role: 'user',
      new_role: 'moderator',
    },
  })

  // Get audit logs
  const logs = await getAuditLogs({
    userId: userId,
    limit: 10,
  })

  return { isAdmin, user, admins, logs }
}

/**
 * Example 3: Using View Functions
 */
export async function exampleViewQueries() {
  // Get dashboard statistics
  const stats = await getDashboardStats()

  // Get recent activity (last 20 actions)
  const recentActivity = await getRecentActivity(20)

  // Get user activity summary
  const userActivity = await getUserActivitySummary(50)

  // Refresh materialized view (should be done via cron job)
  await refreshDashboardStats()

  return { stats, recentActivity, userActivity }
}

/**
 * Example 4: Server Component Usage
 *
 * Use in a React Server Component (app directory)
 */
export async function ServerComponentExample() {
  // This function can be called directly in a Server Component
  const stats = await getDashboardStats()

  return {
    totalUsers: stats.total_users,
    activeUsers: stats.active_users,
    recentActions: stats.actions_today,
  }
}

/**
 * Example 5: API Route Usage (Route Handler)
 *
 * Use in an API route (app/api/star/route.ts)
 */
export async function apiRouteExample(userId: string) {
  try {
    // Check permissions
    const isAdmin = await isUserAdmin(userId)

    if (!isAdmin) {
      return {
        error: 'Unauthorized',
        status: 403,
      }
    }

    // Get data
    const stats = await getDashboardStats()
    const recentActivity = await getRecentActivity(10)

    // Log the action
    await createAuditLog({
      user_id: userId,
      action: 'dashboard.viewed',
      category: 'system',
      description: 'Admin viewed dashboard',
    })

    return {
      data: {
        stats,
        recentActivity,
      },
      status: 200,
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      error: 'Internal server error',
      status: 500,
    }
  }
}

/**
 * Example 6: Transaction Usage
 *
 * Use transactions when you need to ensure multiple operations succeed or fail together
 */
export async function exampleTransaction(
  userId: string,
  newRole: 'admin' | 'moderator' | 'user',
  adminId: string
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update role
      const updatedRole = await tx.user_roles.update({
        where: { user_id: userId },
        data: {
          role: newRole,
          assigned_by: adminId,
          updated_at: new Date(),
        },
      })

      // Update profile status if needed
      await tx.user_profiles.upsert({
        where: { user_id: userId },
        update: {
          status: 'active',
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          status: 'active',
        },
      })

      // Create audit log
      await tx.audit_logs.create({
        data: {
          user_id: adminId,
          action: 'user.role_updated',
          action_category: 'user',
          resource_type: 'user',
          resource_id: userId,
          metadata: {
            description: `Updated user role to ${newRole}`,
            new_role: newRole,
          } as any,
        },
      })

      return updatedRole
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Transaction failed:', error)
    return { success: false, error: 'Failed to update user role' }
  }
}

/**
 * Example 7: System Settings Management
 */
export async function exampleSystemSettings() {
  // Get a specific setting
  const maintenanceMode = await getSystemSetting('maintenance_mode')

  // Check the value
  const isMaintenanceMode = maintenanceMode?.value === 'true'

  // Update a setting
  const adminId = 'admin-uuid'
  await updateSystemSetting('maintenance_mode', 'false', adminId)

  // Log the change
  await createAuditLog({
    user_id: adminId,
    action: 'settings.updated',
    category: 'system',
    entity_type: 'system_settings',
    entity_id: 'maintenance_mode',
    description: 'Updated maintenance mode setting',
    metadata: {
      previous_value: maintenanceMode?.value,
      new_value: 'false',
    },
  })

  return { isMaintenanceMode }
}
