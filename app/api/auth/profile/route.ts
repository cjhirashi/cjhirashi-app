/**
 * API Route to get current user profile
 * Used by client-side hooks
 *
 * NOTE: This endpoint is heavily cached on the client side to prevent
 * excessive requests. Cache duration is 5 minutes.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/permissions'

// Set response headers for caching
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=300, s-maxage=0', // 5 minutes client-side cache
  'Content-Type': 'application/json',
}

export async function GET() {
  try {
    // Add timeout to prevent long-running queries
    const userPromise = getCurrentUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
    )

    let user
    try {
      user = await Promise.race([userPromise, timeoutPromise])
    } catch (error) {
      if ((error as Error).message === 'Request timeout') {
        console.error('Profile API timeout - returning 504')
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 504, headers: CACHE_HEADERS }
        )
      }
      throw error
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401, headers: CACHE_HEADERS }
      )
    }

    return NextResponse.json(user, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          ...CACHE_HEADERS,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}
