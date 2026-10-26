import { db } from '@/db';
import * as schema from '@/db/schema';
import { jsonError, jsonSingle } from '@/lib/api/response';
import { signToken } from '@/lib/jwt';
import { getPermissionsForRoles } from '@/lib/rbac';
import { AuthUserDto, LoginResponseDto } from '@/lib/api/types';
import { eq, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AUTH_COOKIE } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string };

    if (!username || !password) {
      return jsonError(400, 'BAD_REQUEST', 'Username and password are required', '/api/auth/login');
    }

    // Load user with roles
    const userRows = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        displayName: schema.users.displayName,
        department: schema.users.department,
        status: schema.users.status,
        mfaEnabled: schema.users.mfaEnabled,
        passwordHash: schema.users.passwordHash,
        failedLoginCount: schema.users.failedLoginCount,
        lockedUntil: schema.users.lockedUntil,
      })
      .from(schema.users)
      .where(or(eq(schema.users.username, username), eq(schema.users.email, username)))
      .limit(1);

    if (userRows.length === 0) {
      return jsonError(401, 'INVALID_CREDENTIALS', 'Invalid username or password', '/api/auth/login');
    }

    const u = userRows[0];

    // Check account status
    if (u.status === 'LOCKED' || u.status === 'INACTIVE') {
      return jsonError(401, 'ACCOUNT_LOCKED', 'Account is locked or inactive', '/api/auth/login');
    }

    // Check temporary lock
    if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) {
      return jsonError(401, 'ACCOUNT_LOCKED', 'Account is temporarily locked due to failed attempts', '/api/auth/login');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, u.passwordHash);
    if (!passwordValid) {
      // Increment failed count
      const newCount = (u.failedLoginCount || 0) + 1;
      const lockUntil = newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db
        .update(schema.users)
        .set({
          failedLoginCount: newCount,
          lockedUntil: lockUntil,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, u.id));

      return jsonError(401, 'INVALID_CREDENTIALS', 'Invalid username or password', '/api/auth/login');
    }

    // Fetch roles
    const roleRows = await db
      .select({ roleName: schema.roles.name })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, u.id));

    const roles = roleRows.map((r) => r.roleName);
    // Fallback: if no roles in DB yet, grant SOC_ANALYST
    const effectiveRoles = roles.length > 0 ? roles : ['SOC_ANALYST'];

    // Reset failed login counter, update last login
    await db
      .update(schema.users)
      .set({
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, u.id));

    // Sign JWT
    const token = await signToken({
      sub: u.id,
      username: u.username,
      displayName: u.displayName,
      roles: effectiveRoles,
    });

    const userDto: AuthUserDto = {
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      department: u.department,
      status: u.status as AuthUserDto['status'],
      mfaEnabled: u.mfaEnabled,
      roles: effectiveRoles,
      permissions: getPermissionsForRoles(effectiveRoles),
    };

    const responseDto: LoginResponseDto = {
      token,
      tokenType: 'Bearer',
      user: userDto,
    };

    // Set httpOnly cookie
    const response = NextResponse.json(
      { success: true, data: responseDto, timestamp: new Date().toISOString() },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('POST /api/auth/login error:', error);
    return jsonError(500, 'INTERNAL_SERVER_ERROR', 'Authentication failed', '/api/auth/login');
  }
}
