/**
 * API Route to get current user profile
 * Used by client-side hooks
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/permissions'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
