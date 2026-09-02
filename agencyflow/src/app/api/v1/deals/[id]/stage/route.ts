import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;
    const body = await request.json();
    const { stage, stageId, lossReason } = body;

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

    // Resolve target stage from pipeline stages
    const targetStage = await prisma.pipelineStage.findFirst({
      where: {
        workspaceId: session.workspaceId,
        OR: [
          ...(stageId ? [{ id: stageId }] : []),
          ...(stage ? [{ key: stage }, { name: stage }] : []),
        ],
      },
    });

    // Check stage-specific required fields
    if (targetStage?.requiredFields && Array.isArray(targetStage.requiredFields)) {
      for (const field of targetStage.requiredFields) {
        if (field === 'value' && (!existingDeal.value || existingDeal.value <= 0)) {
          return NextResponse.json(
            { success: false, error: `Stage '${targetStage.name}' requires a deal value greater than $0.` },
            { status: 400 }
          );
        }
        if (field === 'expectedCloseDate' && !existingDeal.expectedCloseDate) {
          return NextResponse.json(
            { success: false, error: `Stage '${targetStage.name}' requires an expected close date.` },
            { status: 400 }
          );
        }
      }
    }

    const nextStageKey = targetStage ? targetStage.key : stage;

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stage: nextStageKey,
        stageId: targetStage?.id || existingDeal.stageId,
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
        content: `Moved deal "${existingDeal.title}" to ${targetStage?.name || nextStageKey}.${
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
      { success: false, error: error.message || 'Failed to update deal stage' },
      { status }
    );
  }
}
