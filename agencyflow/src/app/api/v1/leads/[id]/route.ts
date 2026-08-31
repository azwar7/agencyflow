import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;

    // Strict workspace-scoped lookup to prevent cross-tenant IDOR
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { fullName: true } } },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch lead' } },
      { status }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;
    const body = await request.json();

    // Verify lead exists and belongs strictly to the authenticated workspace
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // If reassignment is requested, ensure target user belongs to this workspace
    if (body.assignedToId) {
      const targetUser = await prisma.user.findFirst({
        where: {
          id: body.assignedToId,
          workspaceId: session.workspaceId,
        },
      });

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: { message: 'Assigned user does not belong to this workspace.' } },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.leadScore !== undefined ? { leadScore: body.leadScore } : {}),
        ...(body.aiSummary ? { aiSummary: body.aiSummary } : {}),
        ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId || null } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update lead' } },
      { status }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;

    // Verify lead exists and belongs strictly to the authenticated workspace
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Cascade delete activities and tasks associated with this lead
    await prisma.$transaction([
      prisma.activity.deleteMany({ where: { leadId: id } }),
      prisma.task.deleteMany({ where: { leadId: id } }),
      prisma.lead.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete lead' } },
      { status }
    );
  }
}

