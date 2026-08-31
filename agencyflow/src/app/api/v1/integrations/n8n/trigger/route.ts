import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const body = await request.json().catch(() => ({}));
    const query = body.query?.trim() || 'Gyms';
    const location = body.location?.trim() || 'Peshawar, Pakistan';
    const webhookUrl = body.webhookUrl?.trim() || process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              'No n8n Webhook URL configured. Please provide a webhook URL or set N8N_WEBHOOK_URL in environment.',
          },
        },
        { status: 400 }
      );
    }

    // Ping n8n webhook asynchronously
    const n8nPayload = {
      query,
      location,
      workspaceId,
      requestedBy: session.email,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Agencyflow-Auth': process.env.N8N_INTEGRATION_SECRET || '',
        },
        body: JSON.stringify(n8nPayload),
      });

      if (!response.ok && response.status !== 200 && response.status !== 201) {
        const errorText = await response.text().catch(() => '');
        console.warn('[n8n Trigger] Webhook returned status:', response.status, errorText);
      }
    } catch (fetchErr: any) {
      console.error('[n8n Trigger] Failed to reach n8n webhook URL:', fetchErr.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Could not connect to n8n webhook: ${fetchErr.message}`,
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `n8n Lead Finder triggered for "${query}" in "${location}". Leads will be automatically ingested into CRM.`,
      target: {
        query,
        location,
        workspaceId,
      },
    });
  } catch (error: any) {
    console.error('[n8n Trigger API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to trigger n8n workflow',
        },
      },
      { status: 500 }
    );
  }
}
