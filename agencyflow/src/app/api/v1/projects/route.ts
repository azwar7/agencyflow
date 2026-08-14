import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        company: { select: { name: true } },
        deliverables: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = projects.map((p) => ({
      id: p.id,
      clientName: p.clientName || p.company?.name || 'Client',
      title: p.title,
      status: p.status,
      statusType: p.statusType,
      progress: p.progress,
      nextMilestone: p.nextMilestone || 'Project Initiation',
      dueDate: p.dueDate ? p.dueDate.toLocaleDateString() : 'TBD',
      budget: `$${p.budget.toLocaleString()}`,
      deliverables: p.deliverables.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
      })),
      team: [{ name: session.fullName, avatar: 'ME', color: 'var(--primary)' }],
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const body = await request.json();

    const project = await prisma.project.create({
      data: {
        workspaceId,
        companyId: body.companyId || null,
        clientName: body.clientName || 'Client',
        title: body.title,
        status: 'ON TRACK',
        statusType: 'success',
        progress: body.progress || 0,
        budget: parseFloat(body.budget || '0'),
        nextMilestone: body.nextMilestone || 'Kickoff & Discovery',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
