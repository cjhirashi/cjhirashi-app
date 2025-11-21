/**
 * Analytics Page
 * Protected by permissions - requires VIEW_ANALYTICS permission
 *
 * Displays comprehensive analytics and statistics for the admin panel
 */

import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { AnalyticsPageClient } from './analytics-page-client'

export default async function AnalyticsPage() {
  // Require VIEW_ANALYTICS permission (or VIEW_DASHBOARD as fallback)
  try {
    await requirePermission(Permission.VIEW_ANALYTICS)
  } catch {
    try {
      await requirePermission(Permission.VIEW_DASHBOARD)
    } catch {
      redirect('/unauthorized')
    }
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect('/unauthorized')
  }

  return (
    <div>
      <AnalyticsPageClient />
    </div>
  )
}
