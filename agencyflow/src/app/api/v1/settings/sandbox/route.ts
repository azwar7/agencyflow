import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const [ws, sampleLeads, realLeads, sampleDeals, realDeals, sampleContacts, realContacts, sampleTasks, realTasks] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { sandboxMode: true, name: true },
      }),
      prisma.lead.count({ where: { workspaceId, isSample: true } }),
      prisma.lead.count({ where: { workspaceId, isSample: false } }),
      prisma.deal.count({ where: { workspaceId, isSample: true } }),
      prisma.deal.count({ where: { workspaceId, isSample: false } }),
      prisma.contact.count({ where: { workspaceId, isSample: true } }),
      prisma.contact.count({ where: { workspaceId, isSample: false } }),
      prisma.task.count({ where: { workspaceId, isSample: true } }),
      prisma.task.count({ where: { workspaceId, isSample: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sandboxMode: ws?.sandboxMode || false,
        demoCounts: {
          leads: sampleLeads,
          deals: sampleDeals,
          contacts: sampleContacts,
          tasks: sampleTasks,
          total: sampleLeads + sampleDeals + sampleContacts + sampleTasks,
        },
        realCounts: {
          leads: realLeads,
          deals: realDeals,
          contacts: realContacts,
          tasks: realTasks,
          total: realLeads + realDeals + realContacts + realTasks,
        },
      },
    });
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
    const sandboxMode = Boolean(body.sandboxMode);

    const updated = await prisma.workspace.update({
      where: { id: session.workspaceId },
      data: { sandboxMode },
      select: { sandboxMode: true },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'SANDBOX_MODE_TOGGLE',
      entityType: 'Workspace',
      entityId: session.workspaceId,
      metadata: { sandboxMode },
    });

    return NextResponse.json({
      success: true,
      message: `Sandbox mode ${sandboxMode ? 'enabled' : 'disabled'}.`,
      data: updated,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update sandbox mode' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
