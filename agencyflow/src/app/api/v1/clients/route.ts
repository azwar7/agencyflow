import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const companies = await prisma.company.findMany({
      where: { workspaceId },
      include: {
        contacts: true,
        deals: {
          include: {
            assignedTo: { select: { fullName: true } },
          },
        },
        projects: true,
        invoices: true,
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
