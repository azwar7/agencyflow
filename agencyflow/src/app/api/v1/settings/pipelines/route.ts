import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { ensureDefaultPipeline } from '@/lib/pipelines';
import { logAuditEvent } from '@/lib/audit';

const createPipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(100),
  stages: z
    .array(
      z.object({
        name: z.string().min(1),
        key: z.string().optional(),
        probability: z.number().min(0).max(100).default(50),
        color: z.string().default('#8b5cf6'),
        requiredFields: z.array(z.string()).optional(),
        isWon: z.boolean().default(false),
        isLost: z.boolean().default(false),
      })
    )
    .min(2, 'Pipeline must have at least 2 stages'),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    await ensureDefaultPipeline(session.workspaceId);

    const pipelines = await prisma.pipeline.findMany({
      where: { workspaceId: session.workspaceId },
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }],
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { deals: true } },
          },
        },
        _count: { select: { deals: true } },
      },
    });

    return NextResponse.json({ success: true, data: pipelines });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = createPipelineSchema.parse(body);

    const pipelineCount = await prisma.pipeline.count({
      where: { workspaceId: session.workspaceId },
    });

    const pipeline = await prisma.pipeline.create({
      data: {
        workspaceId: session.workspaceId,
        name: validated.name.trim(),
        order: pipelineCount,
        isDefault: pipelineCount === 0,
        stages: {
          create: validated.stages.map((st, idx) => ({
            workspaceId: session.workspaceId,
            name: st.name.trim(),
            key: st.key || st.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'),
            probability: st.probability,
            color: st.color,
            order: idx,
            isWon: st.isWon,
            isLost: st.isLost,
            requiredFields: st.requiredFields || undefined,
          })),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'PIPELINE_CREATE',
      entityType: 'Pipeline',
      entityId: pipeline.id,
      metadata: { name: pipeline.name, stageCount: pipeline.stages.length },
    });

    return NextResponse.json({
      success: true,
      message: `Pipeline '${pipeline.name}' created with ${pipeline.stages.length} stages.`,
      data: pipeline,
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
      { success: false, error: { message: error.message || 'Failed to create pipeline' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
