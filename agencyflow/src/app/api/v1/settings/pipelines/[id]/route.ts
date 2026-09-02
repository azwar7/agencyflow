import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const updatePipelineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: pipelineId } = await params;
    const body = await request.json();
    const validated = updatePipelineSchema.parse(body);

    const existing = await prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId: session.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Pipeline not found' } }, { status: 404 });
    }

    // If setting as default, demote any other default pipeline in this workspace
    if (validated.isDefault) {
      await prisma.pipeline.updateMany({
        where: { workspaceId: session.workspaceId, id: { not: pipelineId } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.pipeline.update({
      where: { id: pipelineId },
      data: validated,
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'PIPELINE_UPDATE',
      entityType: 'Pipeline',
      entityId: pipelineId,
      metadata: validated,
    });

    return NextResponse.json({
      success: true,
      message: 'Pipeline updated successfully',
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
      { success: false, error: { message: error.message || 'Failed to update pipeline' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: pipelineId } = await params;

    const existing = await prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId: session.workspaceId },
      include: {
        _count: { select: { deals: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Pipeline not found' } }, { status: 404 });
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { success: false, error: { message: 'Cannot delete the default pipeline. Please set another pipeline as default first.' } },
        { status: 400 }
      );
    }

    if (existing._count.deals > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Cannot delete pipeline with ${existing._count.deals} active deals. Move deals or archive the pipeline instead.`,
          },
        },
        { status: 400 }
      );
    }

    await prisma.pipeline.delete({
      where: { id: pipelineId },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'PIPELINE_DELETE',
      entityType: 'Pipeline',
      entityId: pipelineId,
      metadata: { name: existing.name },
    });

    return NextResponse.json({
      success: true,
      message: `Pipeline '${existing.name}' deleted.`,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete pipeline' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
