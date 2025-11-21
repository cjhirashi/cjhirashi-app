/**
 * API Route: Refresh Dashboard Statistics
 * POST /api/admin/refresh-stats
 *
 * Refreshes the materialized views for dashboard statistics.
 * Requires admin authorization.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser, requireAdmin } from '@/lib/auth/server'
import { refreshDashboardStats } from '@/lib/db/views'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    await requireAdmin()

    // Refresh the materialized views
    await refreshDashboardStats()

    return NextResponse.json(
      {
        success: true,
        message: 'Dashboard statistics refreshed successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    // Check if it's an authorization error
    if (error instanceof Error && error.message.includes('Authorization')) {
      return NextResponse.json(
        {
          error: 'Forbidden: Admin access required',
        },
        { status: 403 }
      )
    }

    // Log the error for debugging
    console.error('Error refreshing dashboard stats:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
