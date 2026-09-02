import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const roleChangeSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: targetUserId } = await params;
    const body = await request.json();
    const validated = roleChangeSchema.parse(body);

    // 1. Guard against self-promotion / self-role change
    if (targetUserId === session.userId) {
      return NextResponse.json(
        { success: false, error: { message: 'You cannot change your own role.' } },
        { status: 400 }
      );
    }

    // 2. Fetch target user and ensure they strictly belong to authenticated workspace
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        workspaceId: session.workspaceId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { message: 'Team member not found in this workspace.' } },
        { status: 404 }
      );
    }

    // 3. Guard against changing OWNER role
    if (targetUser.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: { message: 'The Workspace Owner role cannot be altered.' } },
        { status: 403 }
      );
    }

    // 4. Guard: Only OWNER can assign or remove ADMIN role
    if (
      (validated.role === 'ADMIN' || targetUser.role === 'ADMIN') &&
      session.role !== 'OWNER'
    ) {
      return NextResponse.json(
        { success: false, error: { message: 'Only the Workspace Owner can manage Administrator roles.' } },
        { status: 403 }
      );
    }

    const previousRole = targetUser.role;

    // 5. Update role in database
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: validated.role },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // 6. Log audit event
    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'ROLE_CHANGE',
      entityType: 'User',
      entityId: targetUserId,
      metadata: {
        memberEmail: targetUser.email,
        previousRole,
        newRole: validated.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${targetUser.fullName}'s role to ${validated.role}`,
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
      { success: false, error: { message: error.message || 'Failed to update role' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
