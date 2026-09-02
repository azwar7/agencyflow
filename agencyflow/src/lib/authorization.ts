import { getAuthSession, SessionData } from '@/lib/auth-session';

export const USER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES_REP: 'SALES_REP',
  MARKETING: 'MARKETING',
  VIEWER: 'VIEWER',
  MEMBER: 'MEMBER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 50,
  ADMIN: 40,
  MANAGER: 30,
  SALES_REP: 20,
  MARKETING: 20,
  MEMBER: 10,
  VIEWER: 5,
};

export type CrmResource =
  | 'LEADS'
  | 'CONTACTS'
  | 'COMPANIES'
  | 'DEALS'
  | 'TASKS'
  | 'PIPELINES'
  | 'REPORTS'
  | 'SETTINGS'
  | 'TEAM_MEMBERS'
  | 'AI'
  | 'INTEGRATIONS'
  | 'DATA_EXPORT';

export type CrmAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'EXPORT' | 'MANAGE';

/**
 * Baseline Role Permission Matrix
 */
export const ROLE_PERMISSIONS: Record<string, Record<CrmResource, CrmAction[]>> = {
  OWNER: {
    LEADS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    CONTACTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    COMPANIES: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    DEALS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    TASKS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    PIPELINES: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    REPORTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    SETTINGS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    TEAM_MEMBERS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    AI: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    INTEGRATIONS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    DATA_EXPORT: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
  },
  ADMIN: {
    LEADS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    CONTACTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    COMPANIES: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    DEALS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    TASKS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    PIPELINES: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    REPORTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    SETTINGS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    TEAM_MEMBERS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    AI: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    INTEGRATIONS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    DATA_EXPORT: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
  },
  MANAGER: {
    LEADS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
    CONTACTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
    COMPANIES: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
    DEALS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
    TASKS: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    PIPELINES: ['VIEW', 'CREATE', 'EDIT'],
    REPORTS: ['VIEW', 'EXPORT'],
    SETTINGS: ['VIEW'],
    TEAM_MEMBERS: ['VIEW'],
    AI: ['VIEW', 'CREATE', 'EDIT'],
    INTEGRATIONS: ['VIEW'],
    DATA_EXPORT: ['VIEW', 'EXPORT'],
  },
  SALES_REP: {
    LEADS: ['VIEW', 'CREATE', 'EDIT'],
    CONTACTS: ['VIEW', 'CREATE', 'EDIT'],
    COMPANIES: ['VIEW', 'CREATE', 'EDIT'],
    DEALS: ['VIEW', 'CREATE', 'EDIT'],
    TASKS: ['VIEW', 'CREATE', 'EDIT'],
    PIPELINES: ['VIEW'],
    REPORTS: ['VIEW'],
    SETTINGS: [],
    TEAM_MEMBERS: ['VIEW'],
    AI: ['VIEW', 'CREATE'],
    INTEGRATIONS: [],
    DATA_EXPORT: [],
  },
  MARKETING: {
    LEADS: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'],
    CONTACTS: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'],
    COMPANIES: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'],
    DEALS: ['VIEW'],
    TASKS: ['VIEW', 'CREATE', 'EDIT'],
    PIPELINES: ['VIEW'],
    REPORTS: ['VIEW', 'EXPORT'],
    SETTINGS: [],
    TEAM_MEMBERS: ['VIEW'],
    AI: ['VIEW', 'CREATE', 'EDIT'],
    INTEGRATIONS: ['VIEW'],
    DATA_EXPORT: ['VIEW', 'EXPORT'],
  },
  VIEWER: {
    LEADS: ['VIEW'],
    CONTACTS: ['VIEW'],
    COMPANIES: ['VIEW'],
    DEALS: ['VIEW'],
    TASKS: ['VIEW'],
    PIPELINES: ['VIEW'],
    REPORTS: ['VIEW'],
    SETTINGS: [],
    TEAM_MEMBERS: ['VIEW'],
    AI: ['VIEW'],
    INTEGRATIONS: [],
    DATA_EXPORT: [],
  },
  MEMBER: {
    LEADS: ['VIEW', 'CREATE'],
    CONTACTS: ['VIEW', 'CREATE'],
    COMPANIES: ['VIEW', 'CREATE'],
    DEALS: ['VIEW'],
    TASKS: ['VIEW', 'CREATE', 'EDIT'],
    PIPELINES: ['VIEW'],
    REPORTS: ['VIEW'],
    SETTINGS: [],
    TEAM_MEMBERS: ['VIEW'],
    AI: ['VIEW'],
    INTEGRATIONS: [],
    DATA_EXPORT: [],
  },
};

/**
 * Checks if a given user role possesses permission to perform an action on a resource.
 */
export function hasPermission(
  role: string,
  resource: CrmResource,
  action: CrmAction,
  customPermissions?: Record<string, string[]> | null
): boolean {
  if (!role) return false;
  if (role === 'OWNER') return true;

  // 1. Check custom permissions override if present
  if (customPermissions && Array.isArray(customPermissions[resource])) {
    const list = customPermissions[resource];
    if (list.includes('MANAGE') || list.includes(action)) return true;
  }

  // 2. Check standard role matrix
  const roleRules = ROLE_PERMISSIONS[role.toUpperCase()];
  if (!roleRules) return false;

  const allowedActions = roleRules[resource] || [];
  return allowedActions.includes('MANAGE') || allowedActions.includes(action);
}

/**
 * Server-side guard enforcing granular resource permission.
 * Throws HTTP 403 Forbidden if not permitted.
 */
export function requirePermission(
  session: SessionData,
  resource: CrmResource,
  action: CrmAction,
  customPermissions?: Record<string, string[]> | null
): void {
  if (!session || !session.role) {
    throw new Error('Unauthorized: No active session or role found.');
  }

  if (!hasPermission(session.role, resource, action, customPermissions)) {
    throw new Error(
      `Forbidden: Role '${session.role}' lacks '${action}' permission on '${resource}'.`
    );
  }
}

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
 * Fails closed (returns false) if userRole or minimumRole is missing or not recognized in ROLE_HIERARCHY.
 */
export function hasMinimumRole(userRole: string, minimumRole: UserRole | string): boolean {
  if (!userRole || !minimumRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole];
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  if (typeof userLevel !== 'number' || typeof requiredLevel !== 'number') {
    return false;
  }
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

