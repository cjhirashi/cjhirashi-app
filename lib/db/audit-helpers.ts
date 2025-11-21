/**
 * Audit Log Database Helpers
 *
 * Functions for querying, filtering, and exporting audit logs
 */

import { prisma } from './prisma'
import type { audit_action_category as AuditActionCategory } from '@/lib/generated/prisma'

// Re-export types
export type { audit_action_category } from '@/lib/generated/prisma'
export type { AuditActionCategory }

export interface AuditLogFilters {
  userId?: string
  action?: string
  actionCategory?: AuditActionCategory
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface PaginatedAuditLogs {
  logs: AuditLogWithUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuditLogWithUser {
  id: string
  action: string
  action_category: AuditActionCategory
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown> | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: Date
  user_id: string
  user_email: string | null
  user_name: string | null
  user_role: string | null
}

/**
 * Get audit logs with advanced filtering and pagination
 */
export async function getAuditLogsWithFilters(
  filters: AuditLogFilters,
  page: number = 1,
  pageSize: number = 50,
): Promise<PaginatedAuditLogs> {
  // Validate page and pageSize
  const validPage = Math.max(1, page)
  const validPageSize = Math.min(100, Math.max(1, pageSize))
  const skip = (validPage - 1) * validPageSize

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (filters.userId) {
    where.user_id = filters.userId
  }

  if (filters.action) {
    where.action = {
      contains: filters.action,
      mode: 'insensitive',
    }
  }

  if (filters.actionCategory) {
    where.action_category = filters.actionCategory
  }

  if (filters.resourceType) {
    where.resource_type = filters.resourceType
  }

  if (filters.resourceId) {
    where.resource_id = filters.resourceId
  }

  if (filters.ipAddress) {
    where.ip_address = filters.ipAddress
  }

  if (filters.startDate || filters.endDate) {
    where.created_at = {}
    if (filters.startDate) {
      where.created_at.gte = filters.startDate
    }
    if (filters.endDate) {
      where.created_at.lte = filters.endDate
    }
  }

  if (filters.search) {
    // Search in metadata and description
    where.OR = [
      {
        action: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        metadata: {
          path: ['description'],
          string_contains: filters.search,
        },
      },
    ]
  }

  // Get total count
  const total = await prisma.audit_logs.count({ where })

  // Fetch logs with user info
  const logs = await prisma.audit_logs.findMany({
    where,
    include: {
      users: {
        select: {
          email: true,
          user_profiles: {
            select: {
              full_name: true,
            },
          },
          user_roles: {
            select: {
              role: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    skip,
    take: validPageSize,
  })

  // Transform logs to include user data
  const transformedLogs: AuditLogWithUser[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    action_category: log.action_category,
    resource_type: log.resource_type,
    resource_id: log.resource_id,
    metadata: log.metadata as Record<string, unknown> | null,
    changes: log.changes as Record<string, unknown> | null,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    created_at: log.created_at,
    user_id: log.user_id,
    user_email: log.users?.email || null,
    user_name: log.users?.user_profiles?.full_name || null,
    user_role: log.users?.user_roles?.role || null,
  }))

  return {
    logs: transformedLogs,
    total,
    page: validPage,
    pageSize: validPageSize,
    totalPages: Math.ceil(total / validPageSize),
  }
}

/**
 * Get a specific audit log by ID with full details
 */
export async function getAuditLogById(id: string): Promise<AuditLogWithUser | null> {
  const log = await prisma.audit_logs.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          email: true,
          user_profiles: {
            select: {
              full_name: true,
            },
          },
          user_roles: {
            select: {
              role: true,
            },
          },
        },
      },
    },
  })

  if (!log) {
    return null
  }

  return {
    id: log.id,
    action: log.action,
    action_category: log.action_category,
    resource_type: log.resource_type,
    resource_id: log.resource_id,
    metadata: log.metadata as Record<string, unknown> | null,
    changes: log.changes as Record<string, unknown> | null,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    created_at: log.created_at,
    user_id: log.user_id,
    user_email: log.users?.email || null,
    user_name: log.users?.user_profiles?.full_name || null,
    user_role: log.users?.user_roles?.role || null,
  }
}

/**
 * Get unique actions for filter dropdown
 */
export async function getUniqueActions(): Promise<string[]> {
  const result = await prisma.audit_logs.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  })
  return result.map((r) => r.action)
}

/**
 * Get unique action categories for filter dropdown
 */
export async function getUniqueCategories(): Promise<AuditActionCategory[]> {
  const result = await prisma.audit_logs.findMany({
    select: { action_category: true },
    distinct: ['action_category'],
    orderBy: { action_category: 'asc' },
  })
  return result.map((r) => r.action_category)
}

/**
 * Get unique resource types for filter dropdown
 */
export async function getUniqueResourceTypes(): Promise<(string | null)[]> {
  const result = await prisma.audit_logs.findMany({
    select: { resource_type: true },
    distinct: ['resource_type'],
    where: { resource_type: { not: null } },
    orderBy: { resource_type: 'asc' },
  })
  return result.map((r) => r.resource_type)
}

/**
 * Export audit logs as array without pagination
 * Maximum 10000 records
 */
export async function exportAuditLogs(filters: AuditLogFilters): Promise<AuditLogWithUser[]> {
  // Build where clause (same as getAuditLogsWithFilters)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (filters.userId) {
    where.user_id = filters.userId
  }

  if (filters.action) {
    where.action = {
      contains: filters.action,
      mode: 'insensitive',
    }
  }

  if (filters.actionCategory) {
    where.action_category = filters.actionCategory
  }

  if (filters.resourceType) {
    where.resource_type = filters.resourceType
  }

  if (filters.resourceId) {
    where.resource_id = filters.resourceId
  }

  if (filters.ipAddress) {
    where.ip_address = filters.ipAddress
  }

  if (filters.startDate || filters.endDate) {
    where.created_at = {}
    if (filters.startDate) {
      where.created_at.gte = filters.startDate
    }
    if (filters.endDate) {
      where.created_at.lte = filters.endDate
    }
  }

  if (filters.search) {
    where.OR = [
      {
        action: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        metadata: {
          path: ['description'],
          string_contains: filters.search,
        },
      },
    ]
  }

  // Fetch logs with user info - limit to 10000
  const logs = await prisma.audit_logs.findMany({
    where,
    include: {
      users: {
        select: {
          email: true,
          user_profiles: {
            select: {
              full_name: true,
            },
          },
          user_roles: {
            select: {
              role: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 10000,
  })

  // Transform logs to include user data
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    action_category: log.action_category,
    resource_type: log.resource_type,
    resource_id: log.resource_id,
    metadata: log.metadata as Record<string, unknown> | null,
    changes: log.changes as Record<string, unknown> | null,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    created_at: log.created_at,
    user_id: log.user_id,
    user_email: log.users?.email || null,
    user_name: log.users?.user_profiles?.full_name || null,
    user_role: log.users?.user_roles?.role || null,
  }))
}

/**
 * Create an audit log entry
 */
interface CreateAuditLogParams {
  userId: string
  action: string
  actionCategory: AuditActionCategory
  resourceType?: string | null
  resourceId?: string | null
  changes?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(params: CreateAuditLogParams) {
  return await prisma.audit_logs.create({
    data: {
      user_id: params.userId,
      action: params.action,
      action_category: params.actionCategory,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      changes: params.changes || null,
      metadata: params.metadata || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    },
  })
}
