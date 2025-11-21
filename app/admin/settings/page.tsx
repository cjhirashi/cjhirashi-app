/**
 * Settings Page
 * Protected by permissions - requires VIEW_SETTINGS permission (admin only)
 */

import { getCurrentUser, requirePermission, Permission } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getAllSystemSettingsGrouped } from '@/lib/db/helpers'
import { SettingsPageClient } from '@/components/settings/settings-page-client'

export const metadata = {
  title: 'Configuración del Sistema',
  description: 'Gestiona las configuraciones del sistema',
}

export default async function SettingsPage() {
  // Require VIEW_SETTINGS permission
  try {
    await requirePermission(Permission.VIEW_SETTINGS)
  } catch {
    redirect('/unauthorized')
  }

  const user = await getCurrentUser()
  // For now, only admins can manage settings
  const canManageSettings = user?.role === 'admin' || false

  // Fetch settings grouped by category
  const settingsByCategory = await getAllSystemSettingsGrouped()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la configuración del sistema, organizadas por categoría. Los cambios se aplican
          inmediatamente.
        </p>
      </div>

      <SettingsPageClient
        settingsByCategory={settingsByCategory}
        canManageSettings={canManageSettings}
      />
    </div>
  )
}
