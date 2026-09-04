import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const companies = await prisma.company.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
        createdAt: true,
        contacts: {
          take: 1,
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        deals: {
          select: {
            id: true,
            value: true,
            stage: true,
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            progress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = companies.map((c) => {
      const primaryContact = c.contacts[0];
      const retainerVal = c.deals.reduce((sum, d) => sum + d.value, 0);

      return {
        id: c.id,
        name: c.name,
        domain: c.domain || '',
        industry: c.industry || 'General',
        contact: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'Primary Contact',
        email: primaryContact?.email || 'contact@client.com',
        phone: primaryContact?.phone || '+1 (555) 000-0000',
        retainerValue: retainerVal,
        retainerFormatted: retainerVal > 0 ? `$${retainerVal.toLocaleString()}/mo` : '$0',
        status: c.deals.some((d) => d.stage === 'CLOSED_WON') ? 'Active' : 'Active',
        projectsCount: c.projects.length,
        projects: c.projects.map((p) => ({
          title: p.title,
          stage: p.status,
          value: p.budget,
          progress: p.progress,
        })),
        lastActivity: 'Active',
        createdAt: c.createdAt.toISOString().split('T')[0],
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const body = await req.json();

    const newCompany = await prisma.company.create({
      data: {
        workspaceId,
        name: body.name,
        domain: body.domain || `${body.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        industry: body.industry || 'Digital & Technology',
      },
    });

    if (body.contactName && body.contactEmail) {
      const names = body.contactName.trim().split(' ');
      await prisma.contact.create({
        data: {
          workspaceId,
          companyId: newCompany.id,
          firstName: names[0] || 'Primary',
          lastName: names.slice(1).join(' ') || 'Contact',
          email: body.contactEmail,
          phone: body.contactPhone || null,
        },
      });
    }

    // Log Activity
    await prisma.activity.create({
      data: {
        workspaceId,
        userId,
        type: 'NOTE',
        content: `Created client organization: ${newCompany.name}`,
      },
    });

    return NextResponse.json({ success: true, data: newCompany }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create client' } },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Client ID is required' } },
        { status: 400 }
      );
    }

    // Verify company exists and belongs strictly to authenticated workspace
    const company = await prisma.company.findFirst({
      where: { id, workspaceId },
      include: {
        contacts: true,
        projects: { select: { id: true } },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: { message: 'Client organization not found in this workspace' } },
        { status: 404 }
      );
    }

    // Atomic Hard Delete of Company and related records from database
    await prisma.$transaction(async (tx) => {
      const projectIds = company.projects.map((p) => p.id);

      // 1. Delete deliverables linked to this company's projects
      if (projectIds.length > 0) {
        await tx.deliverable.deleteMany({
          where: { projectId: { in: projectIds }, workspaceId },
        });
      }

      // 2. Delete projects, invoices, proposals, deals, contacts
      await tx.project.deleteMany({ where: { companyId: id, workspaceId } });
      await tx.invoice.deleteMany({ where: { companyId: id, workspaceId } });
      await tx.proposal.deleteMany({ where: { companyId: id, workspaceId } });
      await tx.deal.deleteMany({ where: { companyId: id, workspaceId } });
      await tx.contact.deleteMany({ where: { companyId: id, workspaceId } });

      // 3. Also cascade delete any Leads sharing this exact company name
      const matchingLeads = await tx.lead.findMany({
        where: {
          workspaceId,
          companyName: { equals: company.name, mode: 'insensitive' },
        },
        select: { id: true },
      });

      const leadIds = matchingLeads.map((l) => l.id);
      if (leadIds.length > 0) {
        await tx.outreachEmail.deleteMany({ where: { leadId: { in: leadIds }, workspaceId } });
        await tx.activity.deleteMany({ where: { leadId: { in: leadIds }, workspaceId } });
        await tx.task.deleteMany({ where: { leadId: { in: leadIds }, workspaceId } });
        await tx.leadAiAnalysis.deleteMany({ where: { leadId: { in: leadIds }, workspaceId } });
        await tx.lead.deleteMany({ where: { id: { in: leadIds }, workspaceId } });
      }

      // 4. Delete the company record itself
      await tx.company.delete({ where: { id, workspaceId } });

      // 5. Log audit activity
      await tx.activity.create({
        data: {
          workspaceId,
          userId,
          type: 'NOTE',
          content: `Permanently removed client organization: "${company.name}" and all associated records.`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Client "${company.name}" permanently deleted from database.`,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete client' } },
      { status }
    );
  }
}

