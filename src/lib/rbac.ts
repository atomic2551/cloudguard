/**
 * RBAC helpers — role and permission checking used in API routes and middleware.
 */

export type UserRole = 'ADMIN' | 'SOC_ANALYST' | 'VIEWER';

/** Permissions assigned per role (additive). */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    'alerts:read', 'alerts:write', 'alerts:delete',
    'incidents:read', 'incidents:write', 'incidents:delete',
    'users:read', 'users:write', 'users:delete',
    'rules:read', 'rules:write', 'rules:delete',
    'events:read',
    'findings:read', 'findings:write',
    'cloud_accounts:read', 'cloud_accounts:write',
    'audit:read',
    'reports:read',
  ],
  SOC_ANALYST: [
    'alerts:read', 'alerts:write',
    'incidents:read', 'incidents:write',
    'events:read',
    'findings:read', 'findings:write',
    'rules:read',
    'cloud_accounts:read',
    'audit:read',
    'reports:read',
  ],
  VIEWER: [
    'alerts:read',
    'incidents:read',
    'events:read',
    'findings:read',
    'rules:read',
    'cloud_accounts:read',
    'audit:read',
    'reports:read',
  ],
};

export function getPermissionsForRoles(roles: string[]): string[] {
  const perms = new Set<string>();
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role as UserRole];
    if (rolePerms) {
      rolePerms.forEach((p) => perms.add(p));
    }
  }
  return Array.from(perms);
}

export function hasPermission(roles: string[], permission: string): boolean {
  return getPermissionsForRoles(roles).includes(permission);
}

export function hasRole(roles: string[], role: UserRole): boolean {
  return roles.includes(role);
}
