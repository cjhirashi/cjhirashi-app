/**
 * API Authentication Helpers
 */

import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Require authentication for API routes
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require specific role for API routes
 * Throws error if user doesn't have required role
 */
export async function requireApiRole(
  request: Request,
  requiredRole: 'admin' | 'moderator' | 'user'
): Promise<User> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user role
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!userRole) {
    throw new Error('User role not found');
  }

  // Check role hierarchy
  const roleHierarchy = {
    admin: 3,
    moderator: 2,
    user: 1,
  };

  const userRoleLevel = roleHierarchy[userRole.role as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];

  if (userRoleLevel < requiredRoleLevel) {
    throw new Error(`Insufficient permissions. Required: ${requiredRole}`);
  }

  return user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return userRole?.role === 'admin';
}

/**
 * Check if user is moderator or higher
 */
export async function isModerator(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return userRole?.role === 'admin' || userRole?.role === 'moderator';
}
