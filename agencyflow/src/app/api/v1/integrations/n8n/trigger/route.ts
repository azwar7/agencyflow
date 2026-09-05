import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-session';
import {
  startLeadFinderJob,
  setJobRunning,
  failLeadFinderJob,
} from '@/lib/integrations/n8n/job-tracker';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. No workspace context found.' } },
        { status: 401 }
      );
    }

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

    // 1. Guard against duplicate concurrent executions
    const { job, error: duplicateError } = await startLeadFinderJob({
      workspaceId,
      query,
      location,
      requestedBy: session.email,
    });

    if (duplicateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: duplicateError,
            code: 'JOB_ALREADY_RUNNING',
            activeJob: job,
          },
        },
        { status: 409 }
      );
    }

    // 2. Ping n8n webhook with tracked jobId
    const n8nPayload = {
      jobId: job.id,
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
        console.warn('[n8n Trigger] Webhook returned non-200 status:', response.status, errorText);
      }

      // Mark job as RUNNING
      await setJobRunning(workspaceId, job.id);
    } catch (fetchErr: any) {
      console.error('[n8n Trigger] Failed to reach n8n webhook URL:', fetchErr.message);
      await failLeadFinderJob(workspaceId, `Could not connect to n8n webhook: ${fetchErr.message}`);

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
      message: `AI Lead Finder started in the background for "${query}" in "${location}".`,
      data: {
        job: {
          ...job,
          status: 'RUNNING',
        },
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
