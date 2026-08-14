import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const deliverables = await prisma.deliverable.findMany({
      where: { workspaceId },
      include: {
        project: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = deliverables.map((d) => ({
      id: d.id,
      fileName: d.fileName || d.title,
      fileType: d.fileType as any,
      projectName: d.project?.title || 'General Project',
      version: d.version,
      status: d.status as any,
      statusType: d.statusType as any,
      accentColor: d.accentColor,
      sentDate: d.sentDate.toLocaleDateString(),
      dueDate: d.dueDate ? d.dueDate.toLocaleDateString() : 'Due in 3 days',
      clientContact: d.clientContact || 'Client Lead',
      commentsCount: 0,
      isNew: false,
    }));

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

    const newDeliverable = await prisma.deliverable.create({
      data: {
        workspaceId,
        projectId: body.projectId || null,
        title: body.title || body.fileName || 'Untitled Deliverable',
        fileName: body.fileName || body.title,
        fileType: body.fileType || 'pdf',
        status: 'PENDING CLIENT REVIEW',
        statusType: 'pending',
        version: body.version || 'v1.0',
        clientContact: body.clientContact || 'Primary Contact',
        accentColor: '#ffb95f',
      },
    });

    return NextResponse.json({ success: true, data: newDeliverable }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to create deliverable' }, { status: 500 });
  }
}
