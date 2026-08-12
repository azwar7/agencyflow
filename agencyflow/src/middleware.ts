import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  const isAuthenticated = request.cookies.get('agencyflow_auth')?.value === 'true';

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 1. Unauthenticated user trying to access protected workspace page
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    // Add Cache-Control header to prevent browser back-button caching of protected content
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  // 2. Authenticated user trying to access login/signup pages
  if (isAuthRoute && isAuthenticated) {
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
