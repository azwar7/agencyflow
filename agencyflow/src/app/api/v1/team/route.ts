import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { hashPassword } from '@/lib/password';

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
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: error.message },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    
    // Server-side RBAC: Only OWNER or ADMIN may invite team members
    requireRole(session, ['OWNER', 'ADMIN']);

    const workspaceId = session.workspaceId;
    const body = await req.json();

    const emailNormalized = (body.email || '').toLowerCase().trim();
    if (!emailNormalized) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists.' }, { status: 400 });
    }

    const initialPasswordHash = await hashPassword('AgencyFlow2026!');

    const newUser = await prisma.user.create({
      data: {
        workspaceId,
        email: emailNormalized,
        fullName: body.fullName || 'Team Member',
        role: body.role || 'SALES_REP',
        passwordHash: initialPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    }, { status: 201 });
  } catch (error: any) {
    const isForbidden = error.message?.includes('Forbidden');
    const isUnauthorized = error.message?.includes('Unauthorized');
    return NextResponse.json(
      { success: false, error: error.message },
      { status: isForbidden ? 403 : isUnauthorized ? 401 : 400 }
    );
  }
}
