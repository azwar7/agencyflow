import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session.sessionId) {
      return NextResponse.json(
        { success: false, error: { message: 'Current session ID could not be resolved' } },
        { status: 400 }
      );
    }

    // Delete all sessions for this user EXCEPT current session
    const result = await prisma.session.deleteMany({
      where: {
        userId: session.userId,
        id: { not: session.sessionId },
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'SESSION_REVOKE_ALL',
      entityType: 'Session',
      entityId: session.sessionId,
      metadata: { revokedCount: result.count },
    });

    return NextResponse.json({
      success: true,
      message: `Signed out of ${result.count} other active session${result.count === 1 ? '' : 's'}.`,
      data: { revokedCount: result.count },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to revoke other sessions' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
