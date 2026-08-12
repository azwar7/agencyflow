import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stage, lossReason } = body;

    const existingDeal = await prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });

    const user = await prisma.user.findFirst();

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stage,
        ...(lossReason ? { lossReason } : {}),
      },
    });

    if (user) {
      await prisma.activity.create({
        data: {
          workspaceId: existingDeal.workspaceId,
          userId: user.id,
          dealId: id,
          type: 'STAGE_CHANGE',
          content: `Moved deal "${existingDeal.title}" from ${existingDeal.stage} to ${stage}.${
            lossReason ? ` Reason: "${lossReason}"` : ''
          }`,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}
