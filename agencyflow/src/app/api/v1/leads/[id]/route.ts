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
          take: 50,
          include: { user: { select: { fullName: true } } },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          take: 50,
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

    const companyName = existingLead.companyName?.trim();

    // Perform atomic hard delete of Lead and associated records
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated outreach emails, activities, tasks, and AI analyses
      await tx.outreachEmail.deleteMany({ where: { leadId: id } });
      await tx.activity.deleteMany({ where: { leadId: id } });
      await tx.task.deleteMany({ where: { leadId: id } });
      await tx.leadAiAnalysis.deleteMany({ where: { leadId: id } });

      // 2. Delete the lead itself from the database
      await tx.lead.delete({ where: { id } });

      // 3. If lead had an associated company, check if it should also be removed from Clients section
      if (companyName) {
        // Check if other leads in this workspace share this company name
        const otherLeadsCount = await tx.lead.count({
          where: {
            workspaceId: session.workspaceId,
            id: { not: id },
            companyName: { equals: companyName, mode: 'insensitive' },
          },
        });

        // If no other leads exist, find the Company in this workspace
        if (otherLeadsCount === 0) {
          const company = await tx.company.findFirst({
            where: {
              workspaceId: session.workspaceId,
              name: { equals: companyName, mode: 'insensitive' },
            },
            include: {
              deals: { select: { id: true } },
              projects: { select: { id: true } },
              invoices: { select: { id: true } },
            },
          });

          // Only delete company from Clients if it has no active deals, projects, or invoices
          if (
            company &&
            company.deals.length === 0 &&
            company.projects.length === 0 &&
            company.invoices.length === 0
          ) {
            await tx.contact.deleteMany({ where: { companyId: company.id } });
            await tx.company.delete({ where: { id: company.id } });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lead and associated client records permanently deleted from database',
    });
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

