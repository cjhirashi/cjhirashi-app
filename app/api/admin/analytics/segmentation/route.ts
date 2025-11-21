/**
 * GET /api/admin/analytics/segmentation
 *
 * Fetch user segmentation (by role and status)
 * Requires: VIEW_ANALYTICS permission
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { requirePermission, Permission } from '@/lib/auth/server'
import { getUserSegmentation } from '@/lib/db/analytics-helpers'

export async function GET() {
  try {
    // Verify authentication and permission
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      await requirePermission(Permission.VIEW_ANALYTICS)
    } catch {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get segmentation data
    const data = await getUserSegmentation()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Analytics segmentation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
