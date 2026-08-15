import { NextResponse } from 'next/server';
import { deleteSession, clearSessionCookie } from '@/lib/auth-session';

export async function POST(request: Request) {
  // 1. Invalidate session in database
  await deleteSession(request);

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  // 2. Clear httpOnly session cookies
  clearSessionCookie(response);

  // 3. Prevent cache
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');

  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
