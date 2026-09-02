import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const { id: targetUserId } = await params;

    // 1. Guard against self-deletion
    if (targetUserId === session.userId) {
      return NextResponse.json(
        { success: false, error: { message: 'You cannot remove your own account from the workspace.' } },
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

    // 3. Guard against removing workspace OWNER
    if (targetUser.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: { message: 'The Workspace Owner cannot be removed.' } },
        { status: 403 }
      );
    }

    // 4. If ADMIN is targeted, only OWNER can remove
    if (targetUser.role === 'ADMIN' && session.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: { message: 'Only the Workspace Owner can remove an Administrator.' } },
        { status: 403 }
      );
    }

    // 5. Unassign leads and tasks gracefully to prevent orphaned foreign keys before removal
    await prisma.$transaction(async (tx) => {
      // Reassign leads to current user (the removing admin/owner)
      await tx.lead.updateMany({
        where: { assignedToId: targetUserId, workspaceId: session.workspaceId },
        data: { assignedToId: session.userId },
      });

      // Reassign deals
      await tx.deal.updateMany({
        where: { assignedToId: targetUserId, workspaceId: session.workspaceId },
        data: { assignedToId: session.userId },
      });

      // Invalidate all active sessions for that user
      await tx.session.deleteMany({
        where: { userId: targetUserId },
      });

      // Delete the user record
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    // 6. Log audit event
    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'TEAM_REMOVE',
      entityType: 'User',
      entityId: targetUserId,
      metadata: {
        removedEmail: targetUser.email,
        removedName: targetUser.fullName,
        removedRole: targetUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${targetUser.fullName} has been removed from the workspace.`,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to remove member' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
