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

      const leadsCount = u.leads.length;
      const capacityPercent = Math.min(100, Math.round((leadsCount / 15) * 100));
      const revenueWon = u.deals.filter((d) => d.stage === 'CLOSED_WON').reduce((acc, d) => acc + d.value, 0);
      const tasksCount = u.tasks.length;

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role as any,
        status: 'ACTIVE' as any,
        title:
          u.role === 'OWNER'
            ? 'Workspace Owner & Principal'
            : u.role === 'ADMIN'
            ? 'Administrator'
            : u.role === 'MANAGER'
            ? 'Project Manager'
            : 'Sales Representative',
        leadsAssigned: leadsCount,
        capacityPercent,
        revenueWon,
        revenueWonFormatted: `$${revenueWon.toLocaleString()}`,
        tasksCount,
        projectsCount: 0,
        assignedCount: leadsCount + tasksCount,
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
    requireRole(session, ['OWNER', 'ADMIN']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = inviteSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();
    const requestedRole = (validated.role || 'SALES_REP').toUpperCase();

    // Check if user with this email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'A user with this email is already registered.' } },
        { status: 400 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await prisma.invitation.deleteMany({
      where: { email: emailNormalized, workspaceId, acceptedAt: null },
    });

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
          inviteUrl: `https://agencyflow-crm-beta.vercel.app/accept-invite?token=${rawToken}`,
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
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ['OWNER', 'ADMIN']);

    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    if (id === session.userId) {
      return NextResponse.json({ success: false, error: { message: 'Cannot delete your own account' } }, { status: 400 });
    }

    await prisma.user.deleteMany({
      where: { id, workspaceId },
    });

    return NextResponse.json({ success: true, message: 'Team member removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
