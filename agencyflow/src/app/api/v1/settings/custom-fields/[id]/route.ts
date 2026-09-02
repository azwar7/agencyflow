import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const updateCustomFieldSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: fieldId } = await params;
    const body = await request.json();
    const validated = updateCustomFieldSchema.parse(body);

    const existing = await prisma.customField.findFirst({
      where: { id: fieldId, workspaceId: session.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Custom field not found' } }, { status: 404 });
    }

    const updated = await prisma.customField.update({
      where: { id: fieldId },
      data: validated,
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'CUSTOM_FIELD_UPDATE',
      entityType: 'CustomField',
      entityId: fieldId,
      metadata: validated,
    });

    return NextResponse.json({
      success: true,
      message: 'Custom field updated successfully',
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
      { success: false, error: { message: error.message || 'Failed to update custom field' } },
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

    const { id: fieldId } = await params;

    const existing = await prisma.customField.findFirst({
      where: { id: fieldId, workspaceId: session.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Custom field not found' } }, { status: 404 });
    }

    // Cascade delete values and field definition
    await prisma.customField.delete({
      where: { id: fieldId },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'CUSTOM_FIELD_DELETE',
      entityType: 'CustomField',
      entityId: fieldId,
      metadata: { name: existing.name, key: existing.key, entityType: existing.entityType },
    });

    return NextResponse.json({
      success: true,
      message: `Custom field '${existing.name}' and all associated values deleted.`,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete custom field' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
