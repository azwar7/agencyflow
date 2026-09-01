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

    let proposals = await prisma.proposal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    // If workspace has 0 proposals, seed 2 high-value realistic proposals
    if (proposals.length === 0) {
      await prisma.proposal.createMany({
        data: [
          {
            workspaceId,
            title: 'Real Estate Platform & Automated Lead Capture SOW',
            client: 'Mohmand Property Dealers',
            value: 18500,
            status: 'SENT',
            summary: 'Comprehensive engineering proposal to deploy a modern responsive property catalog web app and automated CRM ingestion webhook to eliminate lead loss and double inquiry response speed.',
            scopeOfWork: [
              {
                phase: 'Phase 1: Architecture & UI/UX Design System',
                duration: 'Weeks 1–2',
                description: 'Full wireframing, property filtering user journeys, and interactive Figma prototypes tailored for luxury property buyers.',
                deliverables: ['Interactive Figma Design System', 'Information Architecture Blueprint'],
              },
              {
                phase: 'Phase 2: Full-Stack Web Application Engineering',
                duration: 'Weeks 3–4',
                description: 'Next.js frontend with dynamic search, PostgreSQL property catalog database, and direct WhatsApp inquiry routing.',
                deliverables: ['Production Next.js Web App', 'PostgreSQL Property Catalog'],
              },
              {
                phase: 'Phase 3: Automated CRM Ingestion & n8n Pipelines',
                duration: 'Week 5',
                description: 'Multi-channel inquiry ingestion, automated lead qualification triggers, and instant CRM synchronization.',
                deliverables: ['n8n Webhook Ingestion Pipeline', 'AI Qualification Trigger System'],
              },
              {
                phase: 'Phase 4: QA Testing, Production Deployment & Staff Training',
                duration: 'Week 6',
                description: 'End-to-end testing, SSL/cloud deployment, security audit, and 2-hour staff onboarding session.',
                deliverables: ['Production Live Deployment', 'Admin Onboarding Video & 30-Day Support'],
              },
            ],
            deliverables: [
              'Full-Stack Next.js Property Web Application',
              'Automated n8n Ingestion Workflows',
              'PostgreSQL CRM Database Integration',
              '30-Day Post-Launch Technical Support',
            ],
            pricingItems: [
              { item: 'UI/UX Design & Architecture Blueprint', description: 'Complete user flow mapping, wireframes, and interactive design system', price: 5500 },
              { item: 'Full-Stack Web App & Property Catalog', description: 'Next.js frontend, database models, and secure API backend', price: 7500 },
              { item: 'Automated CRM & n8n Workflow Pipelines', description: 'Automated lead ingestion, webhook triggers, and multi-channel routing', price: 3500 },
              { item: 'Deployment, Security Audit & Team Training', description: 'Production cloud setup, domain DNS, and 2-hour admin walkthrough', price: 2000 },
            ],
            paymentTerms: '50% upfront deposit on contract signing ($9,250), 25% upon Phase 2 milestone review ($4,625), and 25% upon final live deployment ($4,625).',
            preparedBy: session.fullName || 'Alex Sterling',
            isSample: true,
          },
          {
            workspaceId,
            title: 'Automated CRM Intake & Field Dispatch System',
            client: 'Apex Heating & Air',
            value: 24500,
            status: 'DRAFT',
            summary: 'Strategic proposal to architect and deploy automated dispatch workflows, customer inquiry scoring, and interactive client portal.',
            scopeOfWork: [
              {
                phase: 'Phase 1: Workflow Discovery & Dispatch Architecture',
                duration: 'Weeks 1–2',
                description: 'Mapping field operations, emergency dispatch protocols, and customer notification requirements.',
                deliverables: ['Operational Architecture Blueprint', 'Dispatch Workflow Specs'],
              },
              {
                phase: 'Phase 2: Custom Client Portal & Booking Flow',
                duration: 'Weeks 3–5',
                description: 'Interactive online booking widget with real-time technician scheduling and calendar sync.',
                deliverables: ['Customer Booking Widget', 'Calendar Integration API'],
              },
              {
                phase: 'Phase 3: Automated SMS & Email Pipelines',
                duration: 'Week 6',
                description: 'Automated appointment reminders, quote follow-ups, and review requests.',
                deliverables: ['Automated SMS/Email Pipelines', 'Review Collection Trigger'],
              },
            ],
            deliverables: [
              'Custom Online Booking Portal',
              'Automated Emergency Dispatch Webhooks',
              'SMS/Email Notification Sequences',
              'Admin Dashboard & Analytics',
            ],
            pricingItems: [
              { item: 'Discovery & Dispatch System Architecture', description: 'System design, database architecture, and integration specs', price: 6500 },
              { item: 'Online Booking & Customer Portal', description: 'Interactive web booking flow and customer dashboard', price: 9500 },
              { item: 'Automated SMS/Email Notification Engine', description: 'Twilio/SendGrid workflows and reminder triggers', price: 5500 },
              { item: 'Production Deployment & SLA Support', description: 'Cloud deployment, staff training, and 60-day SLA support', price: 3000 },
            ],
            paymentTerms: '50% upfront deposit on contract signing ($12,250), 25% upon Milestone 2 review ($6,125), and 25% upon final delivery ($6,125).',
            preparedBy: session.fullName || 'Alex Sterling',
            isSample: true,
          },
        ],
      });

      proposals = await prisma.proposal.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
    }

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
