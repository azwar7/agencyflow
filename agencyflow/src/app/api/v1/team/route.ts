import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

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
        title: u.role === 'OWNER' ? 'Agency Owner & Principal' : u.role === 'MANAGER' ? 'Client Success Lead' : 'Solutions Consultant',
        assignedCount: u.leads.length + u.deals.length + u.tasks.length,
        lastActive: 'Active now',
        avatarInitials: initials,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const body = await req.json();

    const emailNormalized = (body.email || '').toLowerCase().trim();

    const newUser = await prisma.user.create({
      data: {
        workspaceId,
        email: emailNormalized,
        fullName: body.fullName || 'Team Member',
        role: body.role || 'SALES_REP',
        passwordHash: 'invited_team_member',
      },
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
