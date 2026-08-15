import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const createProjectSchema = z.object({
  companyId: z.string().optional().nullable(),
  clientName: z.string().min(1).max(255).optional().default('Client'),
  title: z.string().min(1, 'Project title is required').max(255),
  progress: z.coerce.number().min(0).max(100).optional().default(0),
  budget: z.coerce
    .number()
    .min(0, 'Project budget cannot be negative')
    .max(100_000_000, 'Project budget exceeds maximum allowed limit')
    .optional()
    .default(0),
  nextMilestone: z.string().max(255).optional().default('Kickoff & Discovery'),
  dueDate: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        company: { select: { name: true } },
        deliverables: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = projects.map((p) => ({
      id: p.id,
      clientName: p.clientName || p.company?.name || 'Client',
      title: p.title,
      status: p.status,
      statusType: p.statusType,
      progress: p.progress,
      nextMilestone: p.nextMilestone || 'Project Initiation',
      dueDate: p.dueDate ? p.dueDate.toLocaleDateString() : 'TBD',
      budget: `$${p.budget.toLocaleString()}`,
      deliverables: p.deliverables.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
      })),
      team: [{ name: session.fullName, avatar: 'ME', color: 'var(--primary)' }],
    }));

    return NextResponse.json({ success: true, data: formatted });
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

    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    // Validate companyId belongs strictly to authenticated workspace
    if (validated.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: validated.companyId, workspaceId },
      });
      if (!company) {
        return NextResponse.json(
          { success: false, error: { message: 'Referenced company does not exist in this workspace.' } },
          { status: 400 }
        );
      }
    }

    const project = await prisma.project.create({
      data: {
        workspaceId,
        companyId: validated.companyId || null,
        clientName: validated.clientName.trim(),
        title: validated.title.trim(),
        status: 'ON TRACK',
        statusType: 'success',
        progress: validated.progress,
        budget: validated.budget,
        nextMilestone: validated.nextMilestone.trim(),
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}
