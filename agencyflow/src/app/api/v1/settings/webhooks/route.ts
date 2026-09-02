import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { generateWebhookSecret } from '@/lib/webhooks';
import { logAuditEvent } from '@/lib/audit';

const createWebhookSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  targetUrl: z.string().url('Target must be a valid HTTP/HTTPS URL'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const webhooks = await prisma.webhookSubscription.findMany({
      where: { workspaceId: session.workspaceId },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: webhooks });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = createWebhookSchema.parse(body);

    const secret = generateWebhookSecret();

    const created = await prisma.webhookSubscription.create({
      data: {
        workspaceId: session.workspaceId,
        name: validated.name.trim(),
        targetUrl: validated.targetUrl.trim(),
        events: validated.events,
        secret,
        isActive: true,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'WEBHOOK_CREATE',
      entityType: 'WebhookSubscription',
      entityId: created.id,
      metadata: { name: created.name, targetUrl: created.targetUrl, events: created.events },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook subscription created successfully.',
      data: created,
    }, { status: 201 });
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
      { success: false, error: { message: error.message || 'Failed to create webhook' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
