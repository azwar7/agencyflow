import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const policySchema = z.object({
  minPasswordLength: z.number().min(6).max(32).optional(),
  requirePasswordNumbers: z.boolean().optional(),
  requirePasswordSymbols: z.boolean().optional(),
  sessionDurationMinutes: z.number().min(60).max(43200).optional(), // 1 hour to 30 days
  maxConcurrentSessions: z.number().min(1).max(20).optional(),
  require2FAForAll: z.boolean().optional(),
  leadVisibility: z.enum(['ALL', 'ASSIGNED_ONLY', 'TEAM']).optional(),
  contactVisibility: z.enum(['ALL', 'ASSIGNED_ONLY', 'TEAM']).optional(),
  dealVisibility: z.enum(['ALL', 'ASSIGNED_ONLY', 'TEAM']).optional(),
  taskVisibility: z.enum(['ALL', 'ASSIGNED_ONLY', 'TEAM']).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: {
        minPasswordLength: true,
        requirePasswordNumbers: true,
        requirePasswordSymbols: true,
        sessionDurationMinutes: true,
        maxConcurrentSessions: true,
        require2FAForAll: true,
        leadVisibility: true,
        contactVisibility: true,
        dealVisibility: true,
        taskVisibility: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: workspace });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = policySchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: session.workspaceId },
      data: validated,
      select: {
        minPasswordLength: true,
        requirePasswordNumbers: true,
        requirePasswordSymbols: true,
        sessionDurationMinutes: true,
        maxConcurrentSessions: true,
        require2FAForAll: true,
        leadVisibility: true,
        contactVisibility: true,
        dealVisibility: true,
        taskVisibility: true,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'SECURITY_POLICY_UPDATE',
      entityType: 'Workspace',
      entityId: session.workspaceId,
      metadata: validated,
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace security policies and data visibility updated.',
      data: updated,
    });
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
      { success: false, error: { message: error.message || 'Failed to update security policies' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
