import { prisma } from '@/lib/prisma';

export interface LogAuditOptions {
  workspaceId: string;
  userId?: string | null;
  action:
    | 'TEAM_INVITE'
    | 'TEAM_RESEND_INVITE'
    | 'TEAM_CANCEL_INVITE'
    | 'TEAM_REMOVE'
    | 'ROLE_CHANGE'
    | 'USER_SUSPEND'
    | 'USER_REACTIVATE'
    | 'PASSWORD_CHANGE'
    | 'SECURITY_POLICY_UPDATE'
    | 'SETTINGS_UPDATE'
    | 'SESSION_REVOKE'
    | 'SESSION_REVOKE_ALL'
    | 'RECORD_DELETE'
    | string;
  entityType: 'User' | 'Invitation' | 'Workspace' | 'Lead' | 'Deal' | 'Task' | 'Session' | string;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: options.workspaceId,
        userId: options.userId || null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId || null,
        metadata: options.metadata || undefined,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    });
  } catch (error) {
    // Audit logging should fail-safe and not break user operations, but log to stderr
    console.error('[Audit Log Failure]:', error);
  }
}
