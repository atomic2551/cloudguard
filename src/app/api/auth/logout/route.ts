import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json(
    { success: true, data: { message: 'Logged out successfully' }, timestamp: new Date().toISOString() },
    { status: 200 }
  );

  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
