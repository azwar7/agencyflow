import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

const createProposalSchema = z.object({
  companyId: z.string().optional().nullable(),
  title: z.string().min(1, 'Proposal title is required').max(255).optional().default('Master Services Agreement SOW'),
  client: z.string().min(1, 'Client name is required').max(255).optional().default('Client Organization'),
  value: z.coerce
    .number()
    .min(0, 'Proposal value cannot be negative')
    .max(100_000_000, 'Proposal value exceeds maximum allowed limit')
    .optional()
    .default(25000),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']).optional().default('SENT'),
  preparedBy: z.string().max(100).optional(),
});

const patchProposalSchema = z.object({
  id: z.string().min(1, 'Proposal ID is required'),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']).optional().default('ACCEPTED'),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const proposals = await prisma.proposal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = proposals.map((p) => ({
      id: p.id,
      title: p.title,
      client: p.client,
      value: `$${p.value.toLocaleString()}`,
      status: p.status as any,
      preparedBy: p.preparedBy || session.fullName,
      acceptedBy: p.acceptedBy,
      acceptedTitle: p.acceptedTitle,
      date: p.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    // RBAC: Proposal creation restricted to OWNER, ADMIN, MANAGER
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = createProposalSchema.parse(body);

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

    const newProposal = await prisma.proposal.create({
      data: {
        workspaceId,
        companyId: validated.companyId || null,
        title: validated.title.trim(),
        client: validated.client.trim(),
        value: validated.value,
        status: validated.status,
        preparedBy: validated.preparedBy?.trim() || session.fullName,
      },
    });

    return NextResponse.json({ success: true, data: newProposal }, { status: 201 });
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

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession(req);
    // RBAC: Sensitive proposal modifications restricted to OWNER, ADMIN, MANAGER
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = patchProposalSchema.parse(body);

    const updateResult = await prisma.proposal.updateMany({
      where: { id: validated.id, workspaceId },
      data: { status: validated.status },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Proposal not found or does not belong to this workspace.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
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

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    // RBAC: Proposal deletion restricted to OWNER, ADMIN, MANAGER
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    const deleteResult = await prisma.proposal.deleteMany({ where: { id, workspaceId } });
    if (deleteResult.count === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Proposal not found or does not belong to this workspace.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Proposal deleted' });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}
