import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonSingle } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth-middleware';
import { getPermissionsForRoles } from '@/lib/rbac';
import { AuthUserDto } from '@/lib/api/types';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Not authenticated', '/api/auth/me');
  }

  try {
    const rows = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        displayName: schema.users.displayName,
        department: schema.users.department,
        status: schema.users.status,
        mfaEnabled: schema.users.mfaEnabled,
      })
      .from(schema.users)
      .where(eq(schema.users.id, user.sub))
      .limit(1);

    if (rows.length === 0) {
      return jsonError(404, 'NOT_FOUND', 'User not found', '/api/auth/me');
    }

    const u = rows[0];
    const userDto: AuthUserDto = {
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      department: u.department,
      status: u.status as AuthUserDto['status'],
      mfaEnabled: u.mfaEnabled,
      roles: user.roles,
      permissions: getPermissionsForRoles(user.roles),
    };

    return jsonSingle(userDto);
  } catch (error: unknown) {
    console.error('GET /api/auth/me error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch user', '/api/auth/me');
  }
}
