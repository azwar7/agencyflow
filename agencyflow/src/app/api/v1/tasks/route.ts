import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { getVisibilityFilter } from '@/lib/visibility';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const visibilityFilter = await getVisibilityFilter(session, 'task');

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        ...visibilityFilter,
      },
      take: 100,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        createdAt: true,
        assignedTo: { select: { id: true, fullName: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    const enriched = tasks.map((t, index) => {
      let normStatus = 'PENDING';
      if (t.status === 'IN_PROGRESS' || t.status === 'DOING') normStatus = 'IN_PROGRESS';
      else if (t.status === 'ON_HOLD' || t.status === 'REVIEW') normStatus = 'ON_HOLD';
      else if (t.status === 'COMPLETED' || t.status === 'DONE') normStatus = 'COMPLETED';

      const progress = normStatus === 'COMPLETED' ? 100 : normStatus === 'IN_PROGRESS' ? 60 : normStatus === 'ON_HOLD' ? 30 : 0;

      return {
        ...t,
        status: normStatus,
        progress,
        subtasksCount: 0,
        filesCount: 0,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
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

    const task = await prisma.task.create({
      data: {
        workspaceId,
        assignedToId: body.assignedToId || userId,
        leadId: body.leadId || null,
        dealId: body.dealId || null,
        title: body.title || 'Untitled Task',
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: body.priority || 'MEDIUM',
        status: body.status || 'PENDING',
      },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
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
    const { taskId, id, status, priority, title, dueDate } = body;
    const targetId = taskId || id;

    if (!targetId) {
      return NextResponse.json({ success: false, error: { message: 'Task ID is required' } }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (title !== undefined) updateData.title = title;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const updatedTask = await prisma.task.updateMany({
      where: { id: targetId, workspaceId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('taskId');

    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    await prisma.task.deleteMany({
      where: { id, workspaceId },
    });

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}
