import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        contacts: true,
        deals: {
          include: {
            assignedTo: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workspace = await prisma.workspace.findFirst();
    const defaultUser = await prisma.user.findFirst();
    if (!workspace) {
      return NextResponse.json({ success: false, error: 'No workspace found' }, { status: 400 });
    }

    const newCompany = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: body.name,
        domain: body.domain || `${body.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        industry: body.industry || 'Technology',
      },
    });

    if (body.contactName && body.contactEmail) {
      const names = body.contactName.split(' ');
      await prisma.contact.create({
        data: {
          workspaceId: workspace.id,
          companyId: newCompany.id,
          firstName: names[0] || 'Primary',
          lastName: names.slice(1).join(' ') || 'Contact',
          email: body.contactEmail,
          phone: body.contactPhone || null,
        },
      });
    }

    // Log Activity
    if (defaultUser) {
      await prisma.activity.create({
        data: {
          workspaceId: workspace.id,
          userId: defaultUser.id,
          content: `Added new client account: ${newCompany.name}`,
          type: 'NOTE',
        },
      });
    }

    return NextResponse.json({ success: true, data: newCompany });
  } catch (error) {
    console.error('Client creation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create client' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('Client deletion error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete client' }, { status: 500 });
  }
}
