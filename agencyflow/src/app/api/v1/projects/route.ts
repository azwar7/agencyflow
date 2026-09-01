import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const createProjectSchema = z.object({
  companyId: z.string().optional().nullable(),
  clientName: z.string().min(1).max(255).default('Client Organization'),
  title: z.string().min(1, 'Project title is required').max(255),
  progress: z.coerce.number().min(0).max(100).default(15),
  budget: z.coerce.number().min(0).max(100_000_000).default(24000),
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

    let projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        company: { select: { name: true } },
        deliverables: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-seed realistic projects if empty
    if (projects.length === 0) {
      await prisma.project.createMany({
        data: [
          {
            workspaceId,
            clientName: 'Mohmand Property Dealers',
            title: 'Luxury Property Portal & n8n Ingestion Engine',
            status: 'ON TRACK',
            statusType: 'success',
            progress: 65,
            budget: 18500,
            nextMilestone: 'Phase 3: Automated CRM Ingestion & WhatsApp Webhook',
            dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
            isSample: true,
          },
          {
            workspaceId,
            clientName: 'Apex Heating & Air',
            title: 'Automated CRM Intake & Field Dispatch System',
            status: 'ON TRACK',
            statusType: 'success',
            progress: 35,
            budget: 24500,
            nextMilestone: 'Phase 2: Customer Booking Flow & Scheduling API',
            dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
            isSample: true,
          },
          {
            workspaceId,
            clientName: 'Elevate Creative Co.',
            title: 'Enterprise Brand Identity & Design System',
            status: 'AT RISK',
            statusType: 'warning',
            progress: 45,
            budget: 14000,
            nextMilestone: 'Phase 2: Vector Asset Library & Typography Review',
            dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
            isSample: true,
          },
          {
            workspaceId,
            clientName: 'Vanguard Logistics',
            title: 'Fleet Tracking & Route Optimization Dashboard',
            status: 'COMPLETED',
            statusType: 'success',
            progress: 100,
            budget: 32000,
            nextMilestone: 'Phase 4: Production Deployment & Handover Completed',
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            isSample: true,
          },
        ],
      });

      projects = await prisma.project.findMany({
        where: { workspaceId },
        include: {
          company: { select: { name: true } },
          deliverables: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const formatted = projects.map((p) => {
      const budgetNum = p.budget || 20000;
      const invoicedPaid = Math.round(budgetNum * (p.progress >= 50 ? 0.75 : 0.5));
      const remainingBalance = budgetNum - invoicedPaid;

      // Phased milestone active step calculation
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
          { name: session.fullName || 'Alex Rivera', avatar: 'AR', color: '#3b82f6' },
          { name: 'Sarah Jenkins', avatar: 'SJ', color: '#a855f7' },
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
