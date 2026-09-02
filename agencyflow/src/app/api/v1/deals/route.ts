import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { getVisibilityFilter } from '@/lib/visibility';
import { ensureDefaultPipeline } from '@/lib/pipelines';

const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(255),
  value: z.coerce
    .number()
    .min(0, 'Deal value cannot be negative')
    .max(100_000_000, 'Deal value exceeds maximum allowed limit')
    .optional()
    .default(0),
  stage: z.string().optional().default('DISCOVERY'),
  stageId: z.string().optional(),
  pipelineId: z.string().optional(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const visibilityFilter = await getVisibilityFilter(session, 'deal');

    // Ensure default pipeline and stages exist
    const defaultPipeline = await ensureDefaultPipeline(workspaceId);

    const { searchParams } = new URL(request.url);
    const requestedPipelineId = searchParams.get('pipelineId') || defaultPipeline.id;

    // Load requested pipeline with its stages
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: requestedPipelineId, workspaceId },
      include: { stages: { orderBy: { order: 'asc' } } },
    }) || defaultPipeline;

    const deals = await prisma.deal.findMany({
      where: {
        workspaceId,
        pipelineId: pipeline.id,
        ...visibilityFilter,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { fullName: true, avatarUrl: true } },
      },
    });

    const columns = pipeline.stages.map((stage) => {
      const stageDeals = deals.filter(
        (d) => d.stageId === stage.id || d.stage === stage.key || d.stage === stage.name
      );
      const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      return {
        stageId: stage.id,
        stageKey: stage.key,
        label: stage.name,
        probability: stage.probability,
        color: stage.color,
        isWon: stage.isWon,
        isLost: stage.isLost,
        requiredFields: stage.requiredFields as string[] | undefined,
        totalValue,
        count: stageDeals.length,
        deals: stageDeals,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        pipeline: {
          id: pipeline.id,
          name: pipeline.name,
          isDefault: pipeline.isDefault,
        },
        columns,
        totalDeals: deals.length,
      },
    });
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

    const defaultPipeline = await ensureDefaultPipeline(workspaceId);
    const activePipelineId = validated.pipelineId || defaultPipeline.id;

    // Resolve stage
    const stages = defaultPipeline.stages;
    let targetStage = stages.find(
      (s) =>
        s.id === validated.stageId ||
        s.key === validated.stage ||
        s.name.toLowerCase() === validated.stage.toLowerCase()
    );

    if (!targetStage && stages.length > 0) {
      targetStage = stages[0];
    }

    // Check stage-specific required fields
    if (targetStage?.requiredFields && Array.isArray(targetStage.requiredFields)) {
      for (const field of targetStage.requiredFields) {
        if (field === 'value' && (!validated.value || validated.value <= 0)) {
          return NextResponse.json(
            { success: false, error: { message: `Stage '${targetStage.name}' requires a deal value greater than 0.` } },
            { status: 400 }
          );
        }
        if (field === 'expectedCloseDate' && !validated.expectedCloseDate) {
          return NextResponse.json(
            { success: false, error: { message: `Stage '${targetStage.name}' requires an expected close date.` } },
            { status: 400 }
          );
        }
      }
    }

    const deal = await prisma.deal.create({
      data: {
        workspaceId,
        assignedToId: userId,
        pipelineId: activePipelineId,
        stageId: targetStage?.id,
        stage: targetStage?.key || validated.stage,
        title: validated.title.trim(),
        value: validated.value,
        contactId: validated.contactId || undefined,
        companyId: validated.companyId || undefined,
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
        content: `Deal created in stage: ${targetStage?.name || deal.stage} with value $${deal.value.toLocaleString()}`,
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
