import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { testWebhookEndpoint } from '@/lib/webhooks';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);
    const { id } = await params;

    const sub = await prisma.webhookSubscription.findFirst({
      where: { id, workspaceId: session.workspaceId },
    });

    if (!sub) {
      return NextResponse.json(
        { success: false, error: { message: 'Webhook subscription not found' } },
        { status: 404 }
      );
    }

    const testResult = await testWebhookEndpoint(sub.targetUrl, sub.secret);

    // Record test delivery in history
    await prisma.webhookDelivery.create({
      data: {
        subscriptionId: sub.id,
        event: 'ping',
        payload: { test: true, triggeredBy: session.fullName },
        status: testResult.success ? 'SUCCESS' : 'FAILED',
        statusCode: testResult.statusCode || null,
        error: testResult.error || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: testResult.success
        ? `Test event delivered successfully (${testResult.latencyMs}ms, HTTP ${testResult.statusCode}).`
        : `Test delivery failed: ${testResult.error} (${testResult.latencyMs}ms).`,
      data: testResult,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to trigger test webhook' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
