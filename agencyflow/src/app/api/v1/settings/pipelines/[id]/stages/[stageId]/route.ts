import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const updateStageSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  probability: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
  requiredFields: z.array(z.string()).optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: pipelineId, stageId } = await params;
    const body = await request.json();
    const validated = updateStageSchema.parse(body);

    const stage = await prisma.pipelineStage.findFirst({
      where: {
        id: stageId,
        pipelineId,
        workspaceId: session.workspaceId,
      },
    });

    if (!stage) {
      return NextResponse.json({ success: false, error: { message: 'Stage not found' } }, { status: 404 });
    }

    const previousName = stage.name;
    const newKey = validated.name ? validated.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_') : stage.key;

    // Update the stage in database
    const updated = await prisma.pipelineStage.update({
      where: { id: stageId },
      data: {
        ...(validated.name ? { name: validated.name.trim(), key: newKey } : {}),
        ...(typeof validated.probability === 'number' ? { probability: validated.probability } : {}),
        ...(validated.color ? { color: validated.color } : {}),
        ...(validated.requiredFields ? { requiredFields: validated.requiredFields } : {}),
        ...(typeof validated.isWon === 'boolean' ? { isWon: validated.isWon } : {}),
        ...(typeof validated.isLost === 'boolean' ? { isLost: validated.isLost } : {}),
      },
    });

    // If stage was renamed, propagate immediately to all deals linked to this stage!
    if (validated.name && validated.name !== previousName) {
      await prisma.deal.updateMany({
        where: { stageId },
        data: { stage: newKey },
      });
    }

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'STAGE_UPDATE',
      entityType: 'PipelineStage',
      entityId: stageId,
      metadata: { previousName, updatedFields: validated },
    });

    return NextResponse.json({
      success: true,
      message: `Stage '${updated.name}' updated successfully.`,
      data: updated,
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
      { success: false, error: { message: error.message || 'Failed to update stage' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: pipelineId, stageId } = await params;

    const pipeline = await prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId: session.workspaceId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    if (!pipeline) {
      return NextResponse.json({ success: false, error: { message: 'Pipeline not found' } }, { status: 404 });
    }

    if (pipeline.stages.length <= 2) {
      return NextResponse.json(
        { success: false, error: { message: 'A pipeline must have at least 2 stages.' } },
        { status: 400 }
      );
    }

    const stageToDelete = pipeline.stages.find((s) => s.id === stageId);
    if (!stageToDelete) {
      return NextResponse.json({ success: false, error: { message: 'Stage not found' } }, { status: 404 });
    }

    // Find a fallback stage in the same pipeline
    const fallbackStage = pipeline.stages.find((s) => s.id !== stageId);
    if (fallbackStage) {
      // Reassign any existing deals in the deleted stage to fallback stage
      await prisma.deal.updateMany({
        where: { stageId },
        data: {
          stageId: fallbackStage.id,
          stage: fallbackStage.key,
        },
      });
    }

    await prisma.pipelineStage.delete({
      where: { id: stageId },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'STAGE_DELETE',
      entityType: 'PipelineStage',
      entityId: stageId,
      metadata: { deletedStageName: stageToDelete.name, reassignedTo: fallbackStage?.name },
    });

    return NextResponse.json({
      success: true,
      message: `Stage '${stageToDelete.name}' deleted. Any active deals were moved to '${fallbackStage?.name}'.`,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete stage' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
