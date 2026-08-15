import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession, hashToken } from '@/lib/auth-session';
import { requireRole, USER_ROLES, ROLE_HIERARCHY } from '@/lib/authorization';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  role: z.string().optional().default('SALES_REP'),
  fullName: z.string().max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const users = await prisma.user.findMany({
      where: { workspaceId },
      include: {
        leads: true,
        deals: true,
        tasks: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = users.map((u) => {
      const names = u.fullName.split(' ');
      const initials = `${names[0]?.[0] || 'U'}${names[1]?.[0] || ''}`;
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role as any,
        status: 'ACTIVE' as any,
        title:
          u.role === 'OWNER'
            ? 'Agency Owner & Principal'
            : u.role === 'ADMIN'
            ? 'Operations Director'
            : u.role === 'MANAGER'
            ? 'Client Success Lead'
            : 'Solutions Consultant',
        assignedCount: u.leads.length + u.deals.length + u.tasks.length,
        lastActive: 'Active now',
        avatarInitials: initials,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);

    // 1. RBAC: Only OWNER or ADMIN may invite team members
    requireRole(session, ['OWNER', 'ADMIN']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = inviteSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();
    const requestedRole = (validated.role || 'SALES_REP').toUpperCase();

    // 2. Validate requested role against recognized hierarchy
    const roleLevel = ROLE_HIERARCHY[requestedRole];
    if (typeof roleLevel !== 'number') {
      return NextResponse.json(
        { success: false, error: { message: `Invalid role '${requestedRole}' specified.` } },
        { status: 400 }
      );
    }

    // 3. Enforce Role Ceiling & Anti-Escalation:
    // ADMIN can only invite roles strictly below ADMIN (MANAGER, SALES_REP, MEMBER)
    if (session.role === 'ADMIN' && (requestedRole === 'OWNER' || requestedRole === 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Forbidden: Admins are not authorized to assign Owner or Admin roles.' },
        },
        { status: 403 }
      );
    }

    // OWNER cannot create secondary OWNER via standard invitation
    if (session.role === 'OWNER' && requestedRole === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Workspaces may only have one primary Owner. Assign Admin or Manager role instead.' },
        },
        { status: 400 }
      );
    }

    // 4. Check if user with this email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'A user with this email is already registered.' } },
        { status: 400 }
      );
    }

    // 5. Generate cryptographically secure 256-bit invitation token
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    // Clean up any prior pending invitation for this email/workspace
    await prisma.invitation.deleteMany({
      where: { email: emailNormalized, workspaceId, acceptedAt: null },
    });

    // 6. Store only SHA-256 tokenHash in database (Raw token NEVER stored)
    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        invitedById: session.userId,
        email: emailNormalized,
        role: requestedRole,
        tokenHash,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Team invitation generated successfully.',
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          inviteToken: rawToken,
          inviteUrl: `/accept-invite?token=${rawToken}`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isForbidden = error.message?.includes('Forbidden');
    const isUnauthorized = error.message?.includes('Unauthorized');
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: isForbidden ? 403 : isUnauthorized ? 401 : 400 }
    );
  }
}
