import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  // Get the origin from the request header, fallback to localhost for development
  const origin = request.headers.get('origin') || 'http://localhost:3000';

  return NextResponse.redirect(new URL('/auth/login', origin));
}
