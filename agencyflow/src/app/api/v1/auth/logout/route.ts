import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, AUTH_COOKIE_NAME } from '@/lib/auth-session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  // Expire session cookie
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
    httpOnly: false,
  });

  // Expire auth status cookie
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });

  // Ensure response is not cached
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');

  return response;
}

export async function GET() {
  return POST();
}
