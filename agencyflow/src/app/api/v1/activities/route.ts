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
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const body = await request.json();

    // Validate leadId belongs strictly to authenticated workspace
    if (body.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: body.leadId, workspaceId },
      });
      if (!lead) {
        return NextResponse.json(
          { success: false, error: { message: 'Referenced lead does not exist in this workspace.' } },
          { status: 400 }
        );
      }
    }

    // Validate dealId belongs strictly to authenticated workspace
    if (body.dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: body.dealId, workspaceId },
      });
      if (!deal) {
        return NextResponse.json(
          { success: false, error: { message: 'Referenced deal does not exist in this workspace.' } },
          { status: 400 }
        );
      }
    }

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
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}
