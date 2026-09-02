import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const updateWebhookSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  targetUrl: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);
    const { id } = await params;

    const existing = await prisma.webhookSubscription.findFirst({
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Webhook subscription not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateWebhookSchema.parse(body);

    const updated = await prisma.webhookSubscription.update({
      where: { id },
      data: validated,
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'WEBHOOK_UPDATE',
      entityType: 'WebhookSubscription',
      entityId: id,
      metadata: validated,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook subscription updated.',
      data: updated,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update webhook' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);
    const { id } = await params;

    const existing = await prisma.webhookSubscription.findFirst({
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Webhook subscription not found' } },
        { status: 404 }
      );
    }

    await prisma.webhookSubscription.delete({ where: { id } });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'WEBHOOK_DELETE',
      entityType: 'WebhookSubscription',
      entityId: id,
      metadata: { name: existing.name, targetUrl: existing.targetUrl },
    });

    return NextResponse.json({
      success: true,
      message: `Webhook "${existing.name}" has been deleted.`,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete webhook' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
