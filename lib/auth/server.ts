/**
 * Server-side auth exports
 * Use these in Server Components, Server Actions, and API Routes
 */

// Types
export type { UserRole, UserStatus, UserProfile, SessionData } from './types'
export { Permission, ROLE_PERMISSIONS, AuthorizationError } from './types'

// Server-side permissions
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

// Middleware helpers
export { protectAdminRoutes, checkAdminAccess } from './middleware'
