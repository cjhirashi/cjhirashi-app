/**
 * Roles Management Page
 * Protected by permissions - requires VIEW_ROLES permission
 */

import { requirePermission, Permission } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getRoleStats } from '@/lib/db/roles-helpers'
import { RolesPageClient } from './roles-page-client'

export default async function RolesPage() {
  // Require VIEW_ROLES permission
  try {
    await requirePermission(Permission.VIEW_ROLES)
  } catch {
    redirect('/unauthorized')
  }

  // Fetch role statistics
  const roleStats = await getRoleStats()

  return <RolesPageClient roleStats={roleStats} />
}
