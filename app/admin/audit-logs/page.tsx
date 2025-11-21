/**
 * Audit Logs Page
 * Protected by permissions - requires VIEW_AUDIT_LOGS permission
 */

import { redirect } from 'next/navigation'
import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import {
  getUniqueActions,
  getUniqueCategories,
  getUniqueResourceTypes,
} from '@/lib/db/audit-helpers'
import { AuditLogsPageClient } from './audit-logs-page-client'

export default async function AuditLogsPage() {
  // Require VIEW_AUDIT_LOGS permission
  try {
    await requirePermission(Permission.VIEW_AUDIT_LOGS)
  } catch {
    redirect('/unauthorized')
  }

  // Get current user to verify they exist
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch filter options
  const [actions, categories, resourceTypes] = await Promise.all([
    getUniqueActions(),
    getUniqueCategories(),
    getUniqueResourceTypes(),
  ])

  return (
    <AuditLogsPageClient
      initialActions={actions}
      initialCategories={categories}
      initialResourceTypes={resourceTypes}
    />
  )
}
