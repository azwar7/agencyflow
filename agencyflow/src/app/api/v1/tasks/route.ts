import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const tasks = await prisma.task.findMany({
      where: { workspaceId },
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    return NextResponse.json({ success: true, data: tasks });
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

    // 1. Validate assignedToId belongs to authenticated workspace
    if (body.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: body.assignedToId, workspaceId },
      });
      if (!assignedUser) {
        return NextResponse.json(
          { success: false, error: { message: 'Assigned user does not belong to this workspace.' } },
          { status: 400 }
        );
      }
    }

    // 2. Validate leadId belongs to authenticated workspace
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

    // 3. Validate dealId belongs to authenticated workspace
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

    const task = await prisma.task.create({
      data: {
        workspaceId,
        assignedToId: body.assignedToId || userId,
        leadId: body.leadId || null,
        dealId: body.dealId || null,
        title: body.title,
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
        priority: body.priority || 'MEDIUM',
        status: body.status || 'PENDING',
      },
      include: {
        assignedTo: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const body = await request.json();
    const { taskId, status } = body;

    const updatedTask = await prisma.task.updateMany({
      where: { id: taskId, workspaceId },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}
