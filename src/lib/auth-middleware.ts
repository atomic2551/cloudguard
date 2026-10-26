/**
 * Auth middleware helpers — extract and verify the JWT from the request cookie.
 * Used inside API route handlers to enforce authentication and RBAC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { hasPermission } from '@/lib/rbac';
import { jsonError } from '@/lib/api/response';

export const AUTH_COOKIE = 'cg_token';

/** Extract verified JWT payload from request cookie; returns null if absent/invalid. */
export async function getSessionUser(request: NextRequest): Promise<JwtPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/** Require auth; optionally require a permission. Returns 401/403 NextResponse or null on success. */
export async function requireAuth(
  request: NextRequest,
  permission?: string
): Promise<{ user: JwtPayload } | NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required', request.nextUrl.pathname);
  }
  if (permission && !hasPermission(user.roles, permission)) {
    return jsonError(403, 'FORBIDDEN', 'Insufficient permissions', request.nextUrl.pathname);
  }
  return { user };
}

/** Type guard: check if requireAuth returned an error response. */
export function isAuthError(result: { user: JwtPayload } | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
