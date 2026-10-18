import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonSingle } from '@/lib/api/response';
import { AuthUserDto, LoginResponseDto } from '@/lib/api/types';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = body?.username || 'sarah.chen';

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
      .where(eq(schema.users.username, username))
      .limit(1);

    if (users.length === 0) {
      return jsonError(401, 'INVALID_CREDENTIALS', 'Invalid username or password', '/api/auth/login');
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

    const responseDto: LoginResponseDto = {
      token: 'jwt-dev-placeholder-token-' + Date.now(),
      tokenType: 'Bearer',
      user: userDto,
    };

    return jsonSingle(responseDto);
  } catch (error: any) {
    console.error('POST /api/auth/login DB error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Authentication failed', '/api/auth/login');
  }
}
