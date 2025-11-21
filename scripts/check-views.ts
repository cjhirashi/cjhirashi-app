/**
 * Check what columns exist in the admin_dashboard_stats view
 */

import { prisma } from '../lib/db/prisma'

async function checkViews() {
  try {
    console.log('Checking admin_dashboard_stats view structure...\n')

    // Query the view to see what columns exist
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM admin_dashboard_stats LIMIT 1
    `)

    console.log('View result:', result)

    // Check what columns are available
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'admin_dashboard_stats'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    console.log('\nAvailable columns:')
    console.log(columns)

    // Check if views exist
    const views = await prisma.$queryRawUnsafe(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('admin_dashboard_stats', 'recent_activity', 'user_activity_summary')
    `)

    console.log('\nExisting views:')
    console.log(views)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkViews()
