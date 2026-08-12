import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) return NextResponse.json({ success: false, error: 'Workspace required' }, { status: 404 });

    const tasks = await prisma.task.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
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
    const body = await request.json();
    const { title, dueDate, priority, leadId, dealId, assignedToId } = body;

    const workspace = await prisma.workspace.findFirst();
    if (!workspace) return NextResponse.json({ success: false, error: 'Workspace required' }, { status: 404 });

    const user = assignedToId
      ? await prisma.user.findUnique({ where: { id: assignedToId } })
      : await prisma.user.findFirst({ where: { workspaceId: workspace.id } });

    if (!user) return NextResponse.json({ success: false, error: 'User required' }, { status: 400 });

    const newTask = await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        assignedToId: user.id,
        title,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        leadId: leadId || null,
        dealId: dealId || null,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { taskId, status, priority, title, dueDate } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (title !== undefined) updateData.title = title;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    if (!taskId) return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 });
  }
}
