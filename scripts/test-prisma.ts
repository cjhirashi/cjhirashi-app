/**
 * Test Script for Prisma Setup
 *
 * This script tests the Prisma client connection and basic queries
 * Run with: npx tsx scripts/test-prisma.ts
 */

import { prisma } from '../lib/db/prisma'
import {
  getDashboardStats,
  getRecentActivity,
  getUserActivitySummary,
} from '../lib/db/views'
import {
  getUserWithProfile,
  getSystemSettings,
} from '../lib/db/helpers'

async function testPrismaConnection() {
  console.log('🧪 Testing Prisma Connection...\n')

  try {
    // Test 1: Basic connection test
    console.log('Test 1: Database Connection')
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful\n')

    // Test 2: Query user_roles table
    console.log('Test 2: Query user_roles table')
    const userRoles = await prisma.user_roles.findMany({
      take: 5,
    })
    console.log(`✅ Found ${userRoles.length} user roles`)
    if (userRoles.length > 0) {
      console.log('Sample user role:', {
        user_id: userRoles[0].user_id,
        role: userRoles[0].role,
        assigned_at: userRoles[0].assigned_at,
      })
    }
    console.log('')

    // Test 3: Query user_profiles table
    console.log('Test 3: Query user_profiles table')
    const userProfiles = await prisma.user_profiles.findMany({
      take: 5,
    })
    console.log(`✅ Found ${userProfiles.length} user profiles`)
    if (userProfiles.length > 0) {
      console.log('Sample profile:', {
        user_id: userProfiles[0].user_id,
        status: userProfiles[0].status,
        full_name: userProfiles[0].full_name,
      })
    }
    console.log('')

    // Test 4: Query audit_logs table
    console.log('Test 4: Query audit_logs table')
    const auditLogs = await prisma.audit_logs.findMany({
      take: 5,
      orderBy: {
        created_at: 'desc',
      },
    })
    console.log(`✅ Found ${auditLogs.length} audit logs`)
    if (auditLogs.length > 0) {
      console.log('Sample log:', {
        action: auditLogs[0].action,
        action_category: auditLogs[0].action_category,
        created_at: auditLogs[0].created_at,
      })
    }
    console.log('')

    // Test 5: Query system_settings table
    console.log('Test 5: Query system_settings table')
    const settings = await getSystemSettings()
    console.log(`✅ Found ${settings.length} system settings`)
    if (settings.length > 0) {
      console.log('Sample settings:')
      settings.slice(0, 3).forEach(setting => {
        console.log(`  - ${setting.key}: ${setting.value}`)
      })
    }
    console.log('')

    // Test 6: Dashboard stats view
    console.log('Test 6: Dashboard stats view')
    const stats = await getDashboardStats()
    console.log('✅ Dashboard stats retrieved:', {
      total_users: Number(stats.total_users),
      active_users: Number(stats.active_users),
      total_admins: Number(stats.total_admins),
      actions_today: Number(stats.actions_today),
      actions_week: Number(stats.actions_week),
    })
    console.log('')

    // Test 7: Recent activity view
    console.log('Test 7: Recent activity view')
    const recentActivity = await getRecentActivity(5)
    console.log(`✅ Found ${recentActivity.length} recent activities`)
    if (recentActivity.length > 0) {
      console.log('Latest activity:', {
        action: recentActivity[0].action,
        action_category: recentActivity[0].action_category,
        user_email: recentActivity[0].user_email,
        created_at: recentActivity[0].created_at,
      })
    }
    console.log('')

    // Test 8: User activity summary view
    console.log('Test 8: User activity summary view')
    const userActivity = await getUserActivitySummary(5)
    console.log(`✅ Found ${userActivity.length} user activity summaries`)
    if (userActivity.length > 0) {
      console.log('Sample activity:', {
        email: userActivity[0].email,
        role: userActivity[0].role,
        total_actions: Number(userActivity[0].total_actions),
        actions_today: Number(userActivity[0].actions_today),
      })
    }
    console.log('')

    console.log('✅ All tests passed! Prisma is configured correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the tests
testPrismaConnection()
