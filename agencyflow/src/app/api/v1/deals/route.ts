import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { getVisibilityFilter } from '@/lib/visibility';

const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(255),
  value: z.coerce
    .number()
    .min(0, 'Deal value cannot be negative')
    .max(100_000_000, 'Deal value exceeds maximum allowed limit')
    .optional()
    .default(0),
  stage: z
    .enum(['DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
    .optional()
    .default('DISCOVERY'),
  expectedCloseDate: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const visibilityFilter = await getVisibilityFilter(session, 'deal');

    const deals = await prisma.deal.findMany({
      where: {
        workspaceId,
        ...visibilityFilter,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { fullName: true, avatarUrl: true } },
      },
    });

    const STAGES = [
      { id: 'DISCOVERY', label: '1. Discovery' },
      { id: 'PROPOSAL', label: '2. Proposal Sent' },
      { id: 'NEGOTIATION', label: '3. Negotiation' },
      { id: 'CLOSED_WON', label: '4. Closed Won' },
      { id: 'CLOSED_LOST', label: '5. Closed Lost' },
    ];

    const columns = STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage.id);
      const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      return {
        stageId: stage.id,
        label: stage.label,
        totalValue,
        count: stageDeals.length,
        deals: stageDeals,
      };
    });

    return NextResponse.json({ success: true, data: { columns, totalDeals: deals.length } });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const body = await request.json();
    const validated = createDealSchema.parse(body);

    const deal = await prisma.deal.create({
      data: {
        workspaceId,
        assignedToId: userId,
        title: validated.title.trim(),
        value: validated.value,
        stage: validated.stage,
        expectedCloseDate: validated.expectedCloseDate ? new Date(validated.expectedCloseDate) : null,
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        workspaceId,
        userId,
        dealId: deal.id,
        type: 'STAGE_CHANGE',
        content: `Deal created in stage: ${deal.stage} with value $${deal.value.toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: isUnauthorized ? 401 : 400 }
    );
  }
}
