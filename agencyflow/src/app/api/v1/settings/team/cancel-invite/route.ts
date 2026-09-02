import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const cancelSchema = z.object({
  invitationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const { invitationId } = cancelSchema.parse(body);

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        workspaceId: session.workspaceId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: { message: 'Invitation not found' } }, { status: 404 });
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'TEAM_CANCEL_INVITE',
      entityType: 'Invitation',
      entityId: invitationId,
      metadata: { email: invitation.email, role: invitation.role },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation for ${invitation.email} has been canceled.`,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to cancel invitation' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
