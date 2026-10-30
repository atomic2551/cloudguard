/**
 * JWT utility — REMOVED.
 *
 * Spring Boot is the single JWT authority. Next.js does NOT issue or verify tokens.
 * This module is retained only for the JwtPayload type used in UI components
 * that read user info from cookies or server responses.
 */

export interface JwtPayload {
  sub: string;        // user UUID
  username: string;
  displayName: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * @deprecated Do not call — Spring Boot handles all JWT operations.
 * Retained only to avoid breaking imports in UI components that reference this type.
 */
export async function signToken(_payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  throw new Error('JWT signing is handled by Spring Boot. Do not use this function.');
}

/**
 * @deprecated Do not call — Spring Boot handles all JWT verification.
 */
export async function verifyToken(_token: string): Promise<JwtPayload> {
  throw new Error('JWT verification is handled by Spring Boot. Do not use this function.');
}
