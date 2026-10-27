/**
 * Next.js Edge Middleware — protects all routes except /login and /api/auth/*.
 * Verifies the httpOnly JWT cookie; redirects to /login on failure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { AUTH_COOKIE } from '@/lib/auth-middleware';

/** Paths that are always public (no auth required). */
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith('/_next/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    // API calls → 401 JSON, page navigations → redirect to /login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    // Token invalid/expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Session expired', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(AUTH_COOKIE, '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next.js internals.
     * The public list above handles the logic.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
