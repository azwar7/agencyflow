import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000');

    const hasSecret = Boolean(
      process.env.N8N_INTEGRATION_SECRET &&
        process.env.N8N_INTEGRATION_SECRET.trim().length > 0
    );

    const outboundWebhook =
      process.env.N8N_OUTREACH_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      '';

    // Count real leads ingested via n8n
    const n8nLeadsCount = await prisma.lead.count({
      where: {
        workspaceId: session.workspaceId,
        source: { contains: 'n8n', mode: 'insensitive' },
      },
    });

    const recentInboundActivity = await prisma.activity.findMany({
      where: {
        workspaceId: session.workspaceId,
        content: { contains: 'n8n', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        engine: 'n8n (Self-Hosted / Cloud)',
        inboundWebhookEndpoint: `${baseUrl}/api/integrations/n8n/leads`,
        outreachCallbackEndpoint: `${baseUrl}/api/integrations/n8n/outreach/callback`,
        authHeaderRequired: 'Agencyflow-Auth',
        isSecretConfigured: hasSecret,
        outboundWebhookConfigured: Boolean(outboundWebhook),
        outboundWebhookUrlPreview: outboundWebhook
          ? `${outboundWebhook.substring(0, 30)}...`
          : null,
        n8nLeadsCount,
        recentActivity: recentInboundActivity.map((a) => ({
          id: a.id,
          content: a.content,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error: any) {
    const isUnauthorized =
      error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
