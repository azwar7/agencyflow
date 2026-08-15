import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'agencyflow_session';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/pipeline',
  '/leads',
  '/clients',
  '/projects',
  '/tasks',
  '/proposals',
  '/invoices',
  '/deliverables',
  '/files',
  '/analytics',
  '/settings',
  '/team',
  '/ai-copilot',
];

const AUTH_ROUTES = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasSessionCookie = Boolean(sessionToken && sessionToken.trim().length > 0);

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 1. Unauthenticated user trying to access protected workspace page
  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  // 2. User with session cookie trying to access login/signup pages
  if (isAuthRoute && hasSessionCookie) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  const response = NextResponse.next();
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pipeline/:path*',
    '/leads/:path*',
    '/clients/:path*',
    '/projects/:path*',
    '/tasks/:path*',
    '/proposals/:path*',
    '/invoices/:path*',
    '/deliverables/:path*',
    '/files/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/ai-copilot/:path*',
    '/login',
    '/signup',
  ],
};
