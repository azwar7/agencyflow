import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

const reorderSchema = z.object({
  stageIds: z.array(z.string().min(1)),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: pipelineId } = await params;
    const body = await request.json();
    const { stageIds } = reorderSchema.parse(body);

    const pipeline = await prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId: session.workspaceId },
    });

    if (!pipeline) {
      return NextResponse.json({ success: false, error: { message: 'Pipeline not found' } }, { status: 404 });
    }

    // Update order of each stage in a transaction
    await prisma.$transaction(
      stageIds.map((id, index) =>
        prisma.pipelineStage.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    const updatedStages = await prisma.pipelineStage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Stages reordered successfully.',
      data: updatedStages,
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
      { success: false, error: { message: error.message || 'Failed to reorder stages' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
