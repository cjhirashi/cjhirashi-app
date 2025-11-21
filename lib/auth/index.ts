/**
 * Auth module exports
 *
 * IMPORTANT: For better tree-shaking and to avoid mixing client/server code:
 * - Use '@/lib/auth/client' for Client Components
 * - Use '@/lib/auth/server' for Server Components, Server Actions, and API Routes
 *
 * This file exports everything for backward compatibility, but may cause build
 * issues if used in client components.
 */

// Types (safe to import anywhere)
export type { UserRole, UserStatus, UserProfile, SessionData } from './types'
export { Permission, ROLE_PERMISSIONS, AuthorizationError } from './types'

// Server-side permissions (use in Server Components only)
export {
  getCurrentUser,
  getUserRole,
  getRolePermissions,
  roleHasPermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAdmin,
  requireModerator,
  isUserActive,
  getUserStatus,
} from './permissions'

// Client-side hooks (use in Client Components only)
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

// Client-side components (use in Client Components only)
export {
  PermissionGuard,
  AdminOnly,
  ModeratorOnly,
  RoleGuard,
  AuthLoader,
} from './components'

// Middleware helpers (use in middleware only)
export { protectAdminRoutes, checkAdminAccess } from './middleware'
