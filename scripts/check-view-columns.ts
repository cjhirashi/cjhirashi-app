/**
 * Check columns in all views
 */

import { prisma } from '../lib/db/prisma'

async function checkViewColumns() {
  try {
    // Check recent_activity view
    console.log('=== RECENT_ACTIVITY VIEW ===\n')
    const recentActivity = await prisma.$queryRawUnsafe(`
      SELECT * FROM recent_activity LIMIT 1
    `)
    console.log('Sample row:', (recentActivity as any)[0])

    // Check user_activity_summary view
    console.log('\n=== USER_ACTIVITY_SUMMARY VIEW ===\n')
    const userActivity = await prisma.$queryRawUnsafe(`
      SELECT * FROM user_activity_summary LIMIT 1
    `)
    console.log('Sample row:', (userActivity as any)[0])

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkViewColumns()
