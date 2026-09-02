import { prisma } from '@/lib/prisma';

export const DEFAULT_PIPELINE_STAGES = [
  { name: 'Discovery', key: 'DISCOVERY', probability: 20, color: '#38bdf8', order: 0, isWon: false, isLost: false },
  {
    name: 'Proposal Sent',
    key: 'PROPOSAL',
    probability: 50,
    color: '#8b5cf6',
    order: 1,
    isWon: false,
    isLost: false,
    requiredFields: ['value', 'expectedCloseDate'],
  },
  { name: 'Negotiation', key: 'NEGOTIATION', probability: 80, color: '#f59e0b', order: 2, isWon: false, isLost: false },
  { name: 'Closed Won', key: 'CLOSED_WON', probability: 100, color: '#10b981', order: 3, isWon: true, isLost: false },
  { name: 'Closed Lost', key: 'CLOSED_LOST', probability: 0, color: '#ef4444', order: 4, isWon: false, isLost: true },
];

/**
 * Ensures a workspace has at least one active pipeline with stages.
 * Automatically backfills existing unassigned deals to the default pipeline.
 */
export async function ensureDefaultPipeline(workspaceId: string) {
  let pipeline = await prisma.pipeline.findFirst({
    where: { workspaceId, isDefault: true },
    include: { stages: { orderBy: { order: 'asc' } } },
  });

  if (!pipeline) {
    // Check if any pipeline exists at all
    pipeline = await prisma.pipeline.findFirst({
      where: { workspaceId, isArchived: false },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  if (!pipeline) {
    // Create standard default pipeline
    pipeline = await prisma.pipeline.create({
      data: {
        workspaceId,
        name: 'Standard Agency Pipeline',
        isDefault: true,
        order: 0,
        stages: {
          create: DEFAULT_PIPELINE_STAGES.map((s) => ({
            workspaceId,
            name: s.name,
            key: s.key,
            probability: s.probability,
            color: s.color,
            order: s.order,
            isWon: s.isWon,
            isLost: s.isLost,
            requiredFields: s.requiredFields || undefined,
          })),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  // Backfill any deals in this workspace that don't have pipelineId or stageId
  const unlinkedDeals = await prisma.deal.findMany({
    where: {
      workspaceId,
      OR: [{ pipelineId: null }, { stageId: null }],
    },
    take: 100,
  });

  if (unlinkedDeals.length > 0 && pipeline.stages.length > 0) {
    const stageMap = new Map(pipeline.stages.map((s) => [s.key, s.id]));
    const fallbackStageId = pipeline.stages[0].id;

    for (const deal of unlinkedDeals) {
      const matchedStageId = (deal.stage && stageMap.get(deal.stage.toUpperCase())) || fallbackStageId;
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          pipelineId: pipeline.id,
          stageId: matchedStageId,
        },
      });
    }
  }

  return pipeline;
}
