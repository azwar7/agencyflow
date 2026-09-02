import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const statusChangeSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
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
    const validated = statusChangeSchema.parse(body);

    // 1. Guard against self-suspension
    if (targetUserId === session.userId) {
      return NextResponse.json(
        { success: false, error: { message: 'You cannot suspend your own account.' } },
        { status: 400 }
      );
    }

    // 2. Fetch target user scoped to workspace
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

    // 3. Guard against suspending OWNER
    if (targetUser.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: { message: 'The Workspace Owner cannot be suspended.' } },
        { status: 403 }
      );
    }

    // 4. If ADMIN is targeted, only OWNER can suspend
    if (targetUser.role === 'ADMIN' && session.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: { message: 'Only the Workspace Owner can suspend an Administrator.' } },
        { status: 403 }
      );
    }

    // 5. Update user status in DB
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: validated.status },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        role: true,
      },
    });

    // 6. If suspended, invalidate all active sessions for that user immediately
    if (validated.status === 'SUSPENDED') {
      await prisma.session.deleteMany({
        where: { userId: targetUserId },
      });
    }

    // 7. Log audit event
    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: validated.status === 'SUSPENDED' ? 'USER_SUSPEND' : 'USER_REACTIVATE',
      entityType: 'User',
      entityId: targetUserId,
      metadata: {
        memberEmail: targetUser.email,
        newStatus: validated.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${targetUser.fullName} has been ${validated.status === 'SUSPENDED' ? 'suspended' : 'reactivated'}.`,
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
      { success: false, error: { message: error.message || 'Failed to update member status' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
