import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const createStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required').max(60),
  probability: z.number().min(0).max(100).default(50),
  color: z.string().default('#8b5cf6'),
  requiredFields: z.array(z.string()).optional(),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: pipelineId } = await params;
    const body = await request.json();
    const validated = createStageSchema.parse(body);

    const pipeline = await prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId: session.workspaceId },
      include: { stages: true },
    });

    if (!pipeline) {
      return NextResponse.json({ success: false, error: { message: 'Pipeline not found' } }, { status: 404 });
    }

    const stageOrder = pipeline.stages.length;
    const key = validated.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const stage = await prisma.pipelineStage.create({
      data: {
        workspaceId: session.workspaceId,
        pipelineId,
        name: validated.name.trim(),
        key,
        probability: validated.probability,
        color: validated.color,
        order: stageOrder,
        isWon: validated.isWon,
        isLost: validated.isLost,
        requiredFields: validated.requiredFields || undefined,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'STAGE_CREATE',
      entityType: 'PipelineStage',
      entityId: stage.id,
      metadata: { pipelineId, stageName: stage.name, probability: stage.probability },
    });

    return NextResponse.json({
      success: true,
      message: `Stage '${stage.name}' added to pipeline.`,
      data: stage,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to add stage' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
