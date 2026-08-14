import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const activities = await prisma.activity.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { fullName: true, role: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const body = await request.json();

    const newActivity = await prisma.activity.create({
      data: {
        workspaceId,
        userId,
        leadId: body.leadId || null,
        dealId: body.dealId || null,
        type: body.type || 'NOTE',
        content: body.content,
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ success: true, data: newActivity }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
