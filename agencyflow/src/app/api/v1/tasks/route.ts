import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    let tasks = await prisma.task.findMany({
      where: { workspaceId },
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    // Auto-seed rich sample tasks if workspace is empty
    if (tasks.length === 0) {
      const defaultUser = await prisma.user.findFirst({
        where: { workspaceId },
      });
      const userId = defaultUser?.id || session.userId;

      const leadsList = await prisma.lead.findMany({
        where: { workspaceId },
        take: 3,
      });

      const mohmandLead = leadsList.find((l) => l.companyName?.includes('Mohmand')) || leadsList[0];
      const apexLead = leadsList.find((l) => l.companyName?.includes('Apex')) || leadsList[1];

      await prisma.task.createMany({
        data: [
          {
            workspaceId,
            assignedToId: userId,
            leadId: mohmandLead?.id || null,
            title: 'Modern Real Estate UI/UX Redesign',
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
            priority: 'HIGH',
            status: 'PENDING',
            isSample: true,
          },
          {
            workspaceId,
            assignedToId: userId,
            leadId: mohmandLead?.id || null,
            title: 'Interactive Wireframe & Component Architecture',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority: 'LOW',
            status: 'PENDING',
            isSample: true,
          },
          {
            workspaceId,
            assignedToId: userId,
            leadId: apexLead?.id || null,
            title: 'Automated CRM Intake & Webhook Pipeline',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            isSample: true,
          },
          {
            workspaceId,
            assignedToId: userId,
            title: 'Brand Identity & Vector Asset Export',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            priority: 'MEDIUM',
            status: 'IN_PROGRESS',
            isSample: true,
          },
          {
            workspaceId,
            assignedToId: userId,
            title: 'Executive Client SOW & Pricing Review',
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            priority: 'HIGH',
            status: 'ON_HOLD',
            isSample: true,
          },
          {
            workspaceId,
            assignedToId: userId,
            title: 'Initial Lead Scraping & Geoapify Ingestion Test',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            priority: 'HIGH',
            status: 'COMPLETED',
            isSample: true,
          },
        ],
      });

      tasks = await prisma.task.findMany({
        where: { workspaceId },
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: { select: { id: true, fullName: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
          deal: { select: { id: true, title: true, value: true } },
        },
      });
    }

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
