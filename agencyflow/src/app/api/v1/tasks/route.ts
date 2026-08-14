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
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const body = await request.json();

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
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
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
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}
