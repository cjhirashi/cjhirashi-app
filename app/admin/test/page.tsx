/**
 * Test page to verify the authorization system
 */

import { getCurrentUser, hasPermission, Permission } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthTestPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  const permissions = [
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.VIEW_ROLES,
    Permission.EDIT_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ANALYTICS,
  ]

  const permissionResults = await Promise.all(
    permissions.map(async (permission) => ({
      permission,
      hasAccess: await hasPermission(permission),
    }))
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test de Autorización</h1>

      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Información del Usuario</h2>
        <dl className="space-y-2">
          <div>
            <dt className="font-medium">Email:</dt>
            <dd className="text-muted-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="font-medium">Rol:</dt>
            <dd className="text-muted-foreground">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground">
                {user.role}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium">Estado:</dt>
            <dd className="text-muted-foreground">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : user.status === 'suspended'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {user.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium">Nombre Completo:</dt>
            <dd className="text-muted-foreground">{user.full_name || 'No especificado'}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Permisos del Usuario</h2>
        <div className="space-y-2">
          {permissionResults.map(({ permission, hasAccess }) => (
            <div key={permission} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="font-mono text-sm">{permission}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  hasAccess
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {hasAccess ? '✓ Permitido' : '✗ Denegado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
