import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      include: { company: true, contact: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: deals });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) return NextResponse.json({ success: false, error: 'No workspace' }, { status: 400 });

    const newDeal = await prisma.deal.create({
      data: {
        workspaceId: workspace.id,
        title: body.title,
        value: Number(body.value) || 25000,
        stage: 'PROPOSAL',
      },
    });

    return NextResponse.json({ success: true, data: newDeal });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create proposal' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    const updated = await prisma.deal.update({
      where: { id: body.id },
      data: { stage: body.stage || 'CLOSED_WON' },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update proposal' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Proposal deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete proposal' }, { status: 500 });
  }
}
