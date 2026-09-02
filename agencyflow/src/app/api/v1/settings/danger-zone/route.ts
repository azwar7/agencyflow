import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { verifyPassword } from '@/lib/password';
import { logAuditEvent } from '@/lib/audit';

const dangerZoneActionSchema = z.object({
  action: z.enum(['PURGE_CRM_DATA', 'DELETE_WORKSPACE']),
  confirmWorkspaceName: z.string().min(1, 'Workspace confirmation name is required'),
  password: z.string().min(1, 'Current password is required to authorize destructive actions'),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    // Destructive workspace actions require OWNER role strictly
    requireRole(session, ['OWNER']);

    const body = await request.json();
    const validated = dangerZoneActionSchema.parse(body);

    // 1. Fetch workspace and user
    const [workspace, user] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: session.workspaceId },
        select: { id: true, name: true },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, passwordHash: true, email: true },
      }),
    ]);

    if (!workspace || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Workspace or User record not found' } },
        { status: 404 }
      );
    }

    // 2. Validate workspace name confirmation
    if (validated.confirmWorkspaceName.trim() !== workspace.name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Confirmation failed: Typed name "${validated.confirmWorkspaceName}" does not match workspace name "${workspace.name}".`,
          },
        },
        { status: 400 }
      );
    }

    // 3. Verify user password
    const isPasswordValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Security authorization failed: Incorrect password.' } },
        { status: 401 }
      );
    }

    // 4. Execute requested destructive action
    if (validated.action === 'PURGE_CRM_DATA') {
      await prisma.$transaction([
        prisma.leadAiAnalysis.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.outreachEmail.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.activity.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.fileRecord.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.proposal.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.invoice.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.deliverable.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.project.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.task.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.deal.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.lead.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.contact.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.company.deleteMany({ where: { workspaceId: workspace.id } }),
        prisma.customFieldValue.deleteMany({ where: { workspaceId: workspace.id } }),
      ]);

      await logAuditEvent({
        workspaceId: workspace.id,
        userId: session.userId,
        action: 'DANGER_ZONE_PURGE_CRM',
        entityType: 'Workspace',
        entityId: workspace.id,
        metadata: { authorizedBy: session.email },
      });

      return NextResponse.json({
        success: true,
        message: 'All CRM records (leads, contacts, deals, tasks) have been permanently purged.',
      });
    }

    if (validated.action === 'DELETE_WORKSPACE') {
      await logAuditEvent({
        workspaceId: workspace.id,
        userId: session.userId,
        action: 'DANGER_ZONE_DELETE_WORKSPACE',
        entityType: 'Workspace',
        entityId: workspace.id,
        metadata: { authorizedBy: session.email, workspaceName: workspace.name },
      });

      // Cascading delete deletes all related records, invitations, sessions, and users
      await prisma.workspace.delete({
        where: { id: workspace.id },
      });

      return NextResponse.json({
        success: true,
        message: `Workspace "${workspace.name}" has been permanently deleted.`,
        redirectUrl: '/login',
      });
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Action failed' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
