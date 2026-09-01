import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

const createProposalSchema = z.object({
  companyId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  title: z.string().min(1, 'Proposal title is required').max(255).default('Master Services Agreement SOW'),
  client: z.string().min(1, 'Client name is required').max(255).default('Client Organization'),
  value: z.coerce
    .number()
    .min(0, 'Proposal value cannot be negative')
    .max(100_000_000, 'Proposal value exceeds maximum allowed limit')
    .default(25000),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']).default('DRAFT'),
  summary: z.string().optional().nullable(),
  scopeOfWork: z.any().optional().nullable(),
  deliverables: z.any().optional().nullable(),
  pricingItems: z.any().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  preparedBy: z.string().max(100).optional(),
});

const patchProposalSchema = z.object({
  id: z.string().min(1, 'Proposal ID is required'),
  title: z.string().optional(),
  client: z.string().optional(),
  value: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']).optional(),
  summary: z.string().optional().nullable(),
  scopeOfWork: z.any().optional().nullable(),
  deliverables: z.any().optional().nullable(),
  pricingItems: z.any().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
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
      value: p.value,
      valueFormatted: `$${p.value.toLocaleString()}`,
      status: p.status as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED',
      summary: p.summary,
      scopeOfWork: p.scopeOfWork,
      deliverables: p.deliverables,
      pricingItems: p.pricingItems,
      paymentTerms: p.paymentTerms,
      leadId: p.leadId,
      preparedBy: p.preparedBy || session.fullName,
      acceptedBy: p.acceptedBy,
      acceptedTitle: p.acceptedTitle,
      date: p.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      createdAt: p.createdAt.toISOString(),
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
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = createProposalSchema.parse(body);

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
        leadId: validated.leadId || null,
        title: validated.title.trim(),
        client: validated.client.trim(),
        value: validated.value,
        status: validated.status,
        summary: validated.summary || null,
        scopeOfWork: validated.scopeOfWork || null,
        deliverables: validated.deliverables || null,
        pricingItems: validated.pricingItems || null,
        paymentTerms: validated.paymentTerms || null,
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
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = patchProposalSchema.parse(body);

    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.client !== undefined) updateData.client = validated.client;
    if (validated.value !== undefined) updateData.value = validated.value;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.summary !== undefined) updateData.summary = validated.summary;
    if (validated.scopeOfWork !== undefined) updateData.scopeOfWork = validated.scopeOfWork;
    if (validated.deliverables !== undefined) updateData.deliverables = validated.deliverables;
    if (validated.pricingItems !== undefined) updateData.pricingItems = validated.pricingItems;
    if (validated.paymentTerms !== undefined) updateData.paymentTerms = validated.paymentTerms;

    const updateResult = await prisma.proposal.updateMany({
      where: { id: validated.id, workspaceId },
      data: updateData,
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Proposal not found or does not belong to this workspace.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Proposal updated' });
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
