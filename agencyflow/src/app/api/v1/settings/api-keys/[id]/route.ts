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
    const { id } = await params;

    const existing = await prisma.apiKey.findFirst({
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'API key not found' } },
        { status: 404 }
      );
    }

    const revoked = await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'API_KEY_REVOKE',
      entityType: 'ApiKey',
      entityId: id,
      metadata: { name: existing.name, keyPrefix: existing.keyPrefix },
    });

    return NextResponse.json({
      success: true,
      message: `API key "${existing.name}" has been revoked.`,
      data: revoked,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to revoke API key' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
