import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { logAuditEvent } from '@/lib/audit';

function parseUserAgent(ua?: string | null) {
  if (!ua) return { browser: 'Browser', os: 'OS', device: 'Desktop' };
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

  let os = 'OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const isMobile = /mobile|iphone|ipad|android/i.test(ua);
  return { browser, os, device: isMobile ? 'Mobile' : 'Desktop' };
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    // Fetch all active sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    const formatted = sessions.map((s) => {
      const parsed = parseUserAgent(s.userAgent);
      return {
        id: s.id,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
        ipAddress: s.ipAddress || '127.0.0.1',
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        isCurrent: s.id === session.sessionId,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { searchParams } = new URL(request.url);
    const targetSessionId = searchParams.get('sessionId');

    if (!targetSessionId) {
      return NextResponse.json(
        { success: false, error: { message: 'sessionId is required' } },
        { status: 400 }
      );
    }

    // Ensure session belongs strictly to the authenticated user
    const targetSession = await prisma.session.findFirst({
      where: {
        id: targetSessionId,
        userId: session.userId,
      },
    });

    if (!targetSession) {
      return NextResponse.json(
        { success: false, error: { message: 'Session not found' } },
        { status: 404 }
      );
    }

    await prisma.session.delete({
      where: { id: targetSessionId },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'SESSION_REVOKE',
      entityType: 'Session',
      entityId: targetSessionId,
      metadata: { revokedSessionId: targetSessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully.',
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to revoke session' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
