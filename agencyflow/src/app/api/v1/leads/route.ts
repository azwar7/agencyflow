import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';

const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  source: z.string().default('Website Inbound'),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { companyName: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { fullName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ success: true, data: leads });
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
    const validated = createLeadSchema.parse(body);

    const newLead = await prisma.lead.create({
      data: {
        workspaceId,
        assignedToId: userId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone || null,
        companyName: validated.companyName || null,
        source: validated.source,
        status: 'NEW',
        leadScore: 60,
        aiSummary: 'New inbound prospect ingested into CRM.',
      },
      include: { assignedTo: { select: { fullName: true } } },
    });

    // Also auto-create company if companyName provided
    if (validated.companyName) {
      const existingCompany = await prisma.company.findFirst({
        where: { workspaceId, name: validated.companyName },
      });
      if (!existingCompany) {
        await prisma.company.create({
          data: {
            workspaceId,
            name: validated.companyName,
          },
        });
      }
    }

    // Log Activity
    await prisma.activity.create({
      data: {
        workspaceId,
        userId,
        leadId: newLead.id,
        type: 'NOTE',
        content: `Lead created from source: ${validated.source}`,
      },
    });

    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create lead' } },
      { status: 400 }
    );
  }
}
