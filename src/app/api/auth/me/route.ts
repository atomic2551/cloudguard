import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonSingle } from '@/lib/api/response';
import { AuthUserDto } from '@/lib/api/types';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch default active user sarah.chen
    const users = await db
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
      .where(eq(schema.users.username, 'sarah.chen'))
      .limit(1);

    if (users.length === 0) {
      return jsonError(404, 'USER_NOT_FOUND', 'Default active user not found', '/api/auth/me');
    }

    const u = users[0];
    const userDto: AuthUserDto = {
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      department: u.department,
      status: u.status as any,
      mfaEnabled: u.mfaEnabled,
      roles: ['ADMIN'],
      permissions: ['alerts:read', 'alerts:write', 'incidents:read', 'incidents:write'],
    };

    return jsonSingle(userDto);
  } catch (error: any) {
    console.error('GET /api/auth/me DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve current user session', '/api/auth/me');
  }
}
