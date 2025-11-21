/**
 * GET /api/admin/analytics/growth
 *
 * Fetch user growth data for a date range
 * Requires: VIEW_ANALYTICS permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { requirePermission, Permission } from '@/lib/auth/server'
import { getUserGrowthData } from '@/lib/db/analytics-helpers'

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Missing date range parameters' },
        { status: 400 }
      )
    }

    const from = new Date(fromParam)
    const to = new Date(toParam)

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get growth data
    const data = await getUserGrowthData({ from, to })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Analytics growth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
