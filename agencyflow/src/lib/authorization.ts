import { getAuthSession, SessionData } from '@/lib/auth-session';

export const USER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES_REP: 'SALES_REP',
  MEMBER: 'MEMBER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 50,
  ADMIN: 40,
  MANAGER: 30,
  SALES_REP: 20,
  MEMBER: 10,
};

/**
 * Enforces that a request has a valid database-backed session.
 * Throws an Unauthorized error if not authenticated.
 */
export async function requireAuth(request?: Request): Promise<SessionData> {
  return getAuthSession(request);
}

/**
 * Enforces that the authenticated user possesses one of the allowed roles.
 * Throws a Forbidden error (HTTP 403) if the user role is not permitted.
 */
export function requireRole(session: SessionData, allowedRoles: (UserRole | string)[]): void {
  if (!session || !session.role) {
    throw new Error('Unauthorized: No active session or role found.');
  }

  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Forbidden: Role '${session.role}' is not authorized to perform this operation.`);
  }
}

/**
 * Checks if a user's role meets or exceeds a minimum role in the role hierarchy.
 */
export function hasMinimumRole(userRole: string, minimumRole: UserRole | string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Enforces that a database resource strictly belongs to the authenticated tenant workspace.
 * Throws a 404 Not Found error (to avoid leaking resource existence across tenants).
 */
export function requireWorkspaceOwnership<T extends { workspaceId: string }>(
  resource: T | null | undefined,
  session: SessionData,
  resourceName: string = 'Resource'
): T {
  if (!resource || resource.workspaceId !== session.workspaceId) {
    throw new Error(`${resourceName} not found.`);
  }
  return resource;
}
