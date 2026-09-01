import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const createProjectSchema = z.object({
  companyId: z.string().optional().nullable(),
  clientName: z.string().min(1).max(255).default('Client Organization'),
  title: z.string().min(1, 'Project title is required').max(255),
  progress: z.coerce.number().min(0).max(100).default(0),
  budget: z.coerce.number().min(0).max(100_000_000).default(10000),
  status: z.enum(['ON TRACK', 'AT RISK', 'COMPLETED', 'ON HOLD']).default('ON TRACK'),
  nextMilestone: z.string().max(255).default('Phase 1: Architecture & UI/UX Design Kickoff'),
  dueDate: z.string().optional().nullable(),
});

const patchProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  title: z.string().optional(),
  clientName: z.string().optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
  budget: z.coerce.number().min(0).optional(),
  status: z.enum(['ON TRACK', 'AT RISK', 'COMPLETED', 'ON HOLD']).optional(),
  nextMilestone: z.string().optional(),
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

    const formatted = projects.map((p) => {
      const budgetNum = p.budget || 0;
      const invoicedPaid = Math.round(budgetNum * (p.progress >= 50 ? 0.75 : p.progress > 0 ? 0.5 : 0));
      const remainingBalance = budgetNum - invoicedPaid;
      const currentPhase = p.progress < 25 ? 1 : p.progress < 55 ? 2 : p.progress < 85 ? 3 : 4;

      return {
        id: p.id,
        clientName: p.clientName || p.company?.name || 'Client Organization',
        title: p.title,
        status: p.status,
        statusType: p.status === 'ON TRACK' ? 'success' : p.status === 'AT RISK' ? 'warning' : p.status === 'COMPLETED' ? 'primary' : 'neutral',
        progress: p.progress,
        currentPhase,
        nextMilestone: p.nextMilestone || 'Project Initiation',
        dueDate: p.dueDate ? p.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
        budget: budgetNum,
        budgetFormatted: `$${budgetNum.toLocaleString()}`,
        invoicedPaid: `$${invoicedPaid.toLocaleString()}`,
        remainingBalance: `$${remainingBalance.toLocaleString()}`,
        deliverables: p.deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
        })),
        team: [
          { name: session.fullName || 'User', avatar: (session.fullName || 'U').substring(0, 2).toUpperCase(), color: '#3b82f6' },
        ],
      };
    });

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

    const project = await prisma.project.create({
      data: {
        workspaceId,
        companyId: validated.companyId || null,
        clientName: validated.clientName.trim(),
        title: validated.title.trim(),
        status: validated.status,
        statusType: validated.status === 'ON TRACK' ? 'success' : 'warning',
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

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const body = await request.json();
    const validated = patchProjectSchema.parse(body);

    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.clientName !== undefined) updateData.clientName = validated.clientName;
    if (validated.progress !== undefined) updateData.progress = validated.progress;
    if (validated.budget !== undefined) updateData.budget = validated.budget;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.nextMilestone !== undefined) updateData.nextMilestone = validated.nextMilestone;
    if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;

    const updated = await prisma.project.updateMany({
      where: { id: validated.id, workspaceId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    await prisma.project.deleteMany({
      where: { id, workspaceId },
    });

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
