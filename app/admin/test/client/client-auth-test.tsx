/**
 * Client component to test authorization hooks
 */

'use client'

import {
  useUser,
  usePermission,
  useIsAdmin,
  useIsModerator,
  Permission,
  PermissionGuard,
  AdminOnly,
  ModeratorOnly,
} from '@/lib/auth/client'

export function ClientAuthTest() {
  const { user, loading, error } = useUser()
  const isAdmin = useIsAdmin()
  const isModerator = useIsModerator()

  const canViewUsers = usePermission(Permission.VIEW_USERS)
  const canEditUsers = usePermission(Permission.EDIT_USERS)
  const canEditSettings = usePermission(Permission.EDIT_SETTINGS)

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p>Cargando información del usuario...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 border-red-500">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p>No estás autenticado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Información del Usuario (Cliente)</h2>
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
        </dl>
      </div>

      {/* Hook Results */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Resultados de Hooks</h2>
        <div className="space-y-2">
          <HookResult label="useIsAdmin()" value={isAdmin} />
          <HookResult label="useIsModerator()" value={isModerator} />
          <HookResult label="usePermission(VIEW_USERS)" value={canViewUsers} />
          <HookResult label="usePermission(EDIT_USERS)" value={canEditUsers} />
          <HookResult label="usePermission(EDIT_SETTINGS)" value={canEditSettings} />
        </div>
      </div>

      {/* Component Guards */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Componentes de Protección</h2>
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">PermissionGuard (VIEW_USERS):</p>
            <PermissionGuard
              permission={Permission.VIEW_USERS}
              fallback={<div className="text-red-600">✗ No tienes permiso VIEW_USERS</div>}
            >
              <div className="text-green-600">✓ Tienes permiso VIEW_USERS</div>
            </PermissionGuard>
          </div>

          <div>
            <p className="font-medium mb-2">PermissionGuard (EDIT_SETTINGS):</p>
            <PermissionGuard
              permission={Permission.EDIT_SETTINGS}
              fallback={<div className="text-red-600">✗ No tienes permiso EDIT_SETTINGS</div>}
            >
              <div className="text-green-600">✓ Tienes permiso EDIT_SETTINGS</div>
            </PermissionGuard>
          </div>

          <div>
            <p className="font-medium mb-2">AdminOnly:</p>
            <AdminOnly fallback={<div className="text-red-600">✗ No eres admin</div>}>
              <div className="text-green-600">✓ Eres admin</div>
            </AdminOnly>
          </div>

          <div>
            <p className="font-medium mb-2">ModeratorOnly:</p>
            <ModeratorOnly fallback={<div className="text-red-600">✗ No eres moderador</div>}>
              <div className="text-green-600">✓ Eres moderador o admin</div>
            </ModeratorOnly>
          </div>
        </div>
      </div>
    </div>
  )
}

function HookResult({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="font-mono text-sm">{label}</span>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {value ? '✓ true' : '✗ false'}
      </span>
    </div>
  )
}
