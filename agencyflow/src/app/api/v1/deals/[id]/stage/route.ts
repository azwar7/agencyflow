import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;
    const body = await request.json();
    const { stage, lossReason } = body;

    // Verify deal exists and strictly belongs to authenticated tenant workspace
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stage,
        ...(lossReason ? { lossReason } : {}),
      },
    });

    // Log Activity with authenticated user context
    await prisma.activity.create({
      data: {
        workspaceId: session.workspaceId,
        userId: session.userId,
        dealId: id,
        type: 'STAGE_CHANGE',
        content: `Moved deal "${existingDeal.title}" from ${existingDeal.stage} to ${stage}.${
          lossReason ? ` Reason: "${lossReason}"` : ''
        }`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;

    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status }
    );
  }
}
