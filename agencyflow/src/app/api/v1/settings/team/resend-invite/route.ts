import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession, hashToken } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const resendSchema = z.object({
  invitationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const { invitationId } = resendSchema.parse(body);

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        workspaceId: session.workspaceId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: { message: 'Invitation not found' } }, { status: 404 });
    }

    // Refresh token and expiration (+72 hours from now)
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        tokenHash,
        expiresAt,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'TEAM_RESEND_INVITE',
      entityType: 'Invitation',
      entityId: invitationId,
      metadata: { email: invitation.email, role: invitation.role },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${rawToken}`;

    return NextResponse.json({
      success: true,
      message: `Invitation refreshed and resent to ${invitation.email}`,
      data: {
        invitationId: updated.id,
        inviteUrl,
        expiresAt,
      },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to resend invitation' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
