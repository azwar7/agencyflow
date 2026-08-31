import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    const { id: leadId } = await params;

    // Verify lead belongs to authenticated workspace
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: session.workspaceId },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: { message: 'Lead not found in current workspace.' } },
        { status: 404 }
      );
    }

    const [outreachHistory, analyses] = await Promise.all([
      prisma.outreachEmail.findMany({
        where: { leadId, workspaceId: session.workspaceId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leadAiAnalysis.findMany({
        where: { leadId, workspaceId: session.workspaceId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        outreach: outreachHistory,
        analyses,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
      return NextResponse.json(
        { success: false, error: { message: error.message || 'Unauthorized' } },
        { status: 401 }
      );
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: { message: error.message || 'Forbidden' } },
        { status: 403 }
      );
    }

    console.error('[Get Outreach History API Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
