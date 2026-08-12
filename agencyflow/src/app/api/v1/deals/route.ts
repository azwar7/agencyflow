import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) return NextResponse.json({ success: false, error: 'Workspace required' }, { status: 404 });

    const deals = await prisma.deal.findMany({
      where: { workspaceId: workspace.id },
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
    const body = await request.json();
    const workspace = await prisma.workspace.findFirst();
    const user = await prisma.user.findFirst();
    if (!workspace || !user) return NextResponse.json({ success: false, error: 'Setup required' }, { status: 400 });

    const deal = await prisma.deal.create({
      data: {
        workspaceId: workspace.id,
        assignedToId: user.id,
        title: body.title,
        value: parseFloat(body.value || '0'),
        stage: body.stage || 'DISCOVERY',
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}
