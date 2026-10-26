/**
 * JWT utility — sign and verify tokens stored in httpOnly cookies.
 * Uses the jose library (Web Crypto, Edge-runtime compatible).
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cloudguard-soc-dev-secret-change-in-production-32chars'
);

const ALGORITHM = 'HS256';
const EXPIRES_IN = '8h';

export interface JwtPayload {
  sub: string;        // user UUID
  username: string;
  displayName: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: [ALGORITHM] });
  return payload as unknown as JwtPayload;
}
