/**
 * Authentication and Authorization Types
 */

export type UserRole = 'admin' | 'moderator' | 'user'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

/**
 * Permissions system
 * Each permission represents a specific action in the admin panel
 */
export enum Permission {
  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  MANAGE_USER_ROLES = 'manage_user_roles',

  // Role Management
  VIEW_ROLES = 'view_roles',
  EDIT_ROLES = 'edit_roles',

  // Audit Logs
  VIEW_AUDIT_LOGS = 'view_audit_logs',

  // System Settings
  VIEW_SETTINGS = 'view_settings',
  EDIT_SETTINGS = 'edit_settings',

  // Analytics & Dashboard
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_ANALYTICS = 'view_analytics',

  // Content Management (for future features)
  VIEW_CONTENT = 'view_content',
  CREATE_CONTENT = 'create_content',
  EDIT_CONTENT = 'edit_content',
  DELETE_CONTENT = 'delete_content',
}

/**
 * Role to Permissions mapping
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Admins have all permissions
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
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
  ],
  moderator: [
    // Moderators can manage users and content, but not settings or roles
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.VIEW_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
  ],
  user: [
    // Regular users have minimal permissions
    Permission.VIEW_DASHBOARD,
  ],
}

/**
 * User profile with role and permissions
 */
export interface UserProfile {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  full_name?: string
  avatar_url?: string
  last_login_at?: Date
  created_at: Date
}

/**
 * Session data stored in cookies
 */
export interface SessionData {
  user: {
    id: string
    email: string
  }
  role: UserRole
  status: UserStatus
  permissions: Permission[]
}

/**
 * Authorization error
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public requiredPermission?: Permission,
    public userRole?: UserRole
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}
