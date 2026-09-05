import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-session';
import { getActiveLeadFinderJob, dismissLeadFinderJob } from '@/lib/integrations/n8n/job-tracker';

export async function GET(request: Request) {
  try {
    let workspaceId: string | null = null;
    try {
      const session = await getAuthSession(request);
      workspaceId = session.workspaceId;
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized: No active session.' } },
        { status: 401 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. No workspace context found.' } },
        { status: 401 }
      );
    }

    const job = await getActiveLeadFinderJob(workspaceId);

    return NextResponse.json({
      success: true,
      data: {
        job: job || null,
      },
    });
  } catch (error: any) {
    console.error('[Active Job API] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch active job' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    let workspaceId: string | null = null;
    try {
      const session = await getAuthSession(request);
      workspaceId = session.workspaceId;
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized: No active session.' } },
        { status: 401 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. No workspace context found.' } },
        { status: 401 }
      );
    }

    await dismissLeadFinderJob(workspaceId);

    return NextResponse.json({
      success: true,
      message: 'Active lead finder job dismissed.',
    });
  } catch (error: any) {
    console.error('[Active Job API] Dismiss Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to dismiss job' } },
      { status: 500 }
    );
  }
}
