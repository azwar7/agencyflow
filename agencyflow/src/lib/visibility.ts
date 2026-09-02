import { SessionData } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';

export type VisibilityEntity = 'lead' | 'contact' | 'deal' | 'task';

/**
 * Derives the database-level filtering clause for a given entity based on
 * the authenticated user's role and workspace data visibility rules.
 *
 * Enforces:
 * - OWNER and ADMIN always see all records in the workspace.
 * - If entity visibility is set to 'ASSIGNED_ONLY', non-admin users only receive
 *   records assigned directly to their userId.
 * - This is applied directly at the Prisma query level, preventing unauthorized
 *   data from ever leaving the database.
 */
export async function getVisibilityFilter(
  session: SessionData,
  entity: VisibilityEntity
): Promise<Record<string, any>> {
  // 1. Owners and Admins have unrestricted visibility across the tenant
  if (session.role === 'OWNER' || session.role === 'ADMIN') {
    return {};
  }

  // 2. Fetch workspace visibility configuration
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    select: {
      leadVisibility: true,
      contactVisibility: true,
      dealVisibility: true,
      taskVisibility: true,
    },
  });

  if (!workspace) return {};

  const rule =
    entity === 'lead'
      ? workspace.leadVisibility
      : entity === 'deal'
      ? workspace.dealVisibility
      : entity === 'task'
      ? workspace.taskVisibility
      : workspace.contactVisibility;

  if (rule === 'ASSIGNED_ONLY') {
    // Non-admin roles (e.g. SALES_REP, VIEWER) only see records assigned to them
    return { assignedToId: session.userId };
  }

  return {};
}
