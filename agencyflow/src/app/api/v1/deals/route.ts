import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const deals = await prisma.deal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { fullName: true, avatarUrl: true } },
      },
    });

    const STAGES = [
      { id: 'DISCOVERY', label: '1. Discovery' },
      { id: 'PROPOSAL', label: '2. Proposal Sent' },
      { id: 'NEGOTIATION', label: '3. Negotiation' },
      { id: 'CLOSED_WON', label: '4. Closed Won' },
      { id: 'CLOSED_LOST', label: '5. Closed Lost' },
    ];

    const columns = STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage.id);
      const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      return {
        stageId: stage.id,
        label: stage.label,
        totalValue,
        count: stageDeals.length,
        deals: stageDeals,
      };
    });

    return NextResponse.json({ success: true, data: { columns, totalDeals: deals.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const body = await request.json();

    const deal = await prisma.deal.create({
      data: {
        workspaceId,
        assignedToId: userId,
        title: body.title,
        value: parseFloat(body.value || '0'),
        stage: body.stage || 'DISCOVERY',
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        workspaceId,
        userId,
        dealId: deal.id,
        type: 'STAGE_CHANGE',
        content: `Deal created in stage: ${deal.stage} with value $${deal.value.toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}
