/**
 * Users Management Page
 * Protected by permissions - requires VIEW_USERS permission
 */

import { redirect } from 'next/navigation'
import { getCurrentUser, requirePermission, Permission, hasPermission } from '@/lib/auth/server'
import { UsersPageClient } from './page-client'

export default async function UsersPage() {
  // Require VIEW_USERS permission
  try {
    await requirePermission(Permission.VIEW_USERS)
  } catch {
    redirect('/unauthorized')
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Check additional permissions
  const canCreate = await hasPermission(Permission.CREATE_USERS)
  const canEdit = await hasPermission(Permission.EDIT_USERS)
  const canDelete = await hasPermission(Permission.DELETE_USERS)

  return (
    <UsersPageClient
      initialPermissions={{
        canCreate,
        canEdit,
        canDelete,
      }}
    />
  )
}
