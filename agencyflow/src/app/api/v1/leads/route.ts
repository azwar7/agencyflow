import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const workspace = await prisma.workspace.findFirst();
    if (!workspace) return NextResponse.json({ success: false, error: 'No workspace found' }, { status: 404 });

    const leads = await prisma.lead.findMany({
      where: {
        workspaceId: workspace.id,
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
    const body = await request.json();
    const validated = createLeadSchema.parse(body);

    const workspace = await prisma.workspace.findFirst();
    const defaultUser = await prisma.user.findFirst();
    if (!workspace || !defaultUser) return NextResponse.json({ success: false, error: 'Setup required' }, { status: 400 });

    const newLead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        assignedToId: defaultUser.id,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone || null,
        companyName: validated.companyName || null,
        source: validated.source,
        status: 'NEW',
        leadScore: 50, // default baseline
        aiSummary: 'New inbound lead ingested. Initial discovery contact required.',
      },
      include: { assignedTo: { select: { fullName: true } } },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        userId: defaultUser.id,
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
