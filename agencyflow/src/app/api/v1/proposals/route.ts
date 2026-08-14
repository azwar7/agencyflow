import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const proposals = await prisma.proposal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = proposals.map((p) => ({
      id: p.id,
      title: p.title,
      client: p.client,
      value: `$${p.value.toLocaleString()}`,
      status: p.status as any,
      preparedBy: p.preparedBy || session.fullName,
      acceptedBy: p.acceptedBy,
      acceptedTitle: p.acceptedTitle,
      date: p.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const body = await req.json();

    const newProposal = await prisma.proposal.create({
      data: {
        workspaceId,
        companyId: body.companyId || null,
        title: body.title || 'Master Services Agreement SOW',
        client: body.client || 'Client Organization',
        value: parseFloat(body.value || '25000'),
        status: body.status || 'SENT',
        preparedBy: body.preparedBy || session.fullName,
      },
    });

    return NextResponse.json({ success: true, data: newProposal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const body = await req.json();

    await prisma.proposal.updateMany({
      where: { id: body.id, workspaceId },
      data: { status: body.status || 'ACCEPTED' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await prisma.proposal.deleteMany({ where: { id, workspaceId } });
    return NextResponse.json({ success: true, message: 'Proposal deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
