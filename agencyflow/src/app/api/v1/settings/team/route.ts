import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession, hashToken } from '@/lib/auth-session';
import { requireRole, USER_ROLES } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  fullName: z.string().min(1, 'Full name is required').max(100),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER']),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    // Fetch all active/suspended workspace members
    const members = await prisma.user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        avatarUrl: true,
        jobTitle: true,
        phone: true,
        createdAt: true,
        sessions: {
          orderBy: { lastActiveAt: 'desc' },
          take: 1,
          select: { lastActiveAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch all pending invitations
    const invitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedMembers = members.map((m) => {
      const lastSession = m.sessions[0];
      return {
        id: m.id,
        email: m.email,
        fullName: m.fullName,
        role: m.role,
        status: m.status || 'ACTIVE',
        avatarUrl: m.avatarUrl,
        jobTitle: m.jobTitle || 'Team Member',
        phone: m.phone,
        joinedAt: m.createdAt,
        lastActive: lastSession ? lastSession.lastActiveAt : m.createdAt,
        isSelf: m.id === session.userId,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        members: formattedMembers,
        invitations,
        currentUserRole: session.role,
      },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = inviteSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'A user with this email address is already registered.' } },
        { status: 400 }
      );
    }

    // 2. Privilege guard: ADMIN cannot invite an ADMIN or OWNER unless they are OWNER
    if (validated.role === 'ADMIN' && session.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: { message: 'Only the Workspace Owner can invite an Administrator.' } },
        { status: 403 }
      );
    }

    // 3. Remove any previous pending invitation for this email
    await prisma.invitation.deleteMany({
      where: {
        email: emailNormalized,
        workspaceId: session.workspaceId,
      },
    });

    // 4. Generate cryptographic single-use invitation token
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const invitation = await prisma.invitation.create({
      data: {
        email: emailNormalized,
        workspaceId: session.workspaceId,
        invitedById: session.userId,
        role: validated.role,
        tokenHash,
        expiresAt,
      },
    });

    // 5. Log to AuditLog
    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'TEAM_INVITE',
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: {
        invitedEmail: emailNormalized,
        invitedName: validated.fullName,
        assignedRole: validated.role,
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${rawToken}`;

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${emailNormalized}`,
      data: {
        invitationId: invitation.id,
        inviteUrl,
        expiresAt,
      },
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
      { success: false, error: { message: error.message || 'Failed to send invitation' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
