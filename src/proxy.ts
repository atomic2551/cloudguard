/**
 * Next.js 16 Proxy — renamed from middleware.ts per Next 16 convention.
 *
 * This proxy does NOT verify JWTs or enforce authorization.
 * Spring Boot is the single auth authority.
 *
 * Responsibilities:
 *  - Redirect unauthenticated page navigations to /login (cookie-presence check only)
 *  - Let /api/* requests pass through to Spring Boot via next.config.ts rewrites
 */

import { NextRequest, NextResponse } from 'next/server';

/** Cookie name must match what Spring Boot sets on login. */
const AUTH_COOKIE = 'cg_token';

/** Paths that are always public (no auth required). */
const PUBLIC_PATHS = [
  '/login',
  '/_next',
  '/favicon.ico',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // /api/* requests are proxied to Spring Boot — Spring enforces auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Page navigations: check cookie presence (not validity — Spring validates)
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next.js internals.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
