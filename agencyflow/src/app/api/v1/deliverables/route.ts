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
        project: { select: { title: true, clientName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = deliverables.map((d) => ({
      id: d.id,
      title: d.title || d.fileName,
      fileName: d.fileName || d.title,
      fileType: d.fileType as 'pdf' | 'figma' | 'zip' | 'video',
      projectName: d.project?.title || 'Agency Client Solution',
      clientContact: d.clientContact || d.project?.clientName || 'Client Organization',
      version: d.version || 'v1.0',
      status: d.status as 'PENDING CLIENT REVIEW' | 'APPROVED' | 'REVISION REQUESTED',
      statusType: d.status === 'APPROVED' ? 'approved' : d.status === 'REVISION REQUESTED' ? 'revisions' : 'pending',
      accentColor: d.accentColor || '#38bdf8',
      sentDate: d.sentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dueDate: d.dueDate ? d.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Due in 3 days',
      commentsCount: d.status === 'REVISION REQUESTED' ? 3 : d.status === 'PENDING CLIENT REVIEW' ? 1 : 0,
      feedbackNotes: d.status === 'REVISION REQUESTED' 
        ? 'Client requested revisions on this deliverable.'
        : d.status === 'APPROVED'
        ? 'Deliverable officially approved by client.'
        : 'Submitted for client sign-off.',
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
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
        status: body.status || 'PENDING CLIENT REVIEW',
        statusType: body.status === 'APPROVED' ? 'approved' : body.status === 'REVISION REQUESTED' ? 'revisions' : 'pending',
        version: body.version || 'v1.0',
        clientContact: body.clientContact || 'Client Account',
        accentColor: '#38bdf8',
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, data: newDeliverable }, { status: 201 });
  } catch (err: any) {
    const isUnauthorized = err.message?.includes('Unauthorized') || err.message?.includes('session');
    const isForbidden = err.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message || 'Failed to create deliverable' }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const body = await req.json();
    const { id, status, version, title, clientContact } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Deliverable ID is required' }, { status: 400 });

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      updateData.statusType = status === 'APPROVED' ? 'approved' : status === 'REVISION REQUESTED' ? 'revisions' : 'pending';
    }
    if (version) updateData.version = version;
    if (title) updateData.title = title;
    if (clientContact) updateData.clientContact = clientContact;

    const updated = await prisma.deliverable.updateMany({
      where: { id, workspaceId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await prisma.deliverable.deleteMany({
      where: { id, workspaceId },
    });

    return NextResponse.json({ success: true, message: 'Deliverable deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
