/**
 * Client-side auth exports
 * Use these in Client Components
 */

'use client'

// Types
export type { UserRole, UserStatus, UserProfile } from './types'
export { Permission, ROLE_PERMISSIONS } from './types'

// Client-side hooks
export {
  useUser,
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useIsAdmin,
  useIsModerator,
  useRole,
  useIsAuthenticated,
} from './hooks'

// Client-side components
export {
  PermissionGuard,
  AdminOnly,
  ModeratorOnly,
  RoleGuard,
  AuthLoader,
} from './components'
