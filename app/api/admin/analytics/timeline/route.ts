/**
 * GET /api/admin/analytics/timeline
 *
 * Fetch action timeline for a date range
 * Requires: VIEW_ANALYTICS permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { requirePermission, Permission } from '@/lib/auth/server'
import { getActionTimeline } from '@/lib/db/analytics-helpers'

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
    const intervalParam = searchParams.get('interval') as 'hour' | 'day' | undefined

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'Missing date range parameters' },
        { status: 400 }
      )
    }

    const from = new Date(fromParam)
    const to = new Date(toParam)
    const interval: 'hour' | 'day' =
      intervalParam === 'hour' ? 'hour' : 'day'

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get timeline data
    const data = await getActionTimeline({ from, to }, interval)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Analytics timeline error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
