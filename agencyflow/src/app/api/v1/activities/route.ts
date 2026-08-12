import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, dealId, type, content } = body;

    const workspace = await prisma.workspace.findFirst();
    const user = await prisma.user.findFirst();
    if (!workspace || !user) return NextResponse.json({ success: false, error: 'User context required' }, { status: 400 });

    const activity = await prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        leadId: leadId || null,
        dealId: dealId || null,
        type: type || 'NOTE',
        content,
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}
