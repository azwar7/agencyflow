import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    let deliverables = await prisma.deliverable.findMany({
      where: { workspaceId },
      include: {
        project: { select: { title: true, clientName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-seed realistic agency deliverables if empty
    if (deliverables.length === 0) {
      const projects = await prisma.project.findMany({
        where: { workspaceId },
        take: 4,
      });

      const p1 = projects[0];
      const p2 = projects[1];
      const p3 = projects[2];
      const p4 = projects[3];

      await prisma.deliverable.createMany({
        data: [
          {
            workspaceId,
            projectId: p1?.id || null,
            title: 'Mohmand Luxury Property Portal UI Prototype',
            fileName: 'Mohmand_Portal_Figma_Prototype_v2.1.fig',
            fileType: 'figma',
            status: 'PENDING CLIENT REVIEW',
            statusType: 'pending',
            version: 'v2.1',
            clientContact: p1?.clientName || 'Mohmand Property Dealers',
            accentColor: '#38bdf8',
            sentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          },
          {
            workspaceId,
            projectId: p2?.id || null,
            title: 'Apex HVAC Automated Dispatch Architecture SOW',
            fileName: 'Apex_CRM_Dispatch_Architecture_SOW_v1.4.pdf',
            fileType: 'pdf',
            status: 'APPROVED',
            statusType: 'approved',
            version: 'v1.4',
            clientContact: p2?.clientName || 'Apex Heating & Air',
            accentColor: '#4edea3',
            sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          },
          {
            workspaceId,
            projectId: p3?.id || null,
            title: 'Elevate Creative Brand Identity & Typography System',
            fileName: 'Elevate_Brand_Identity_Guidelines_v1.0.fig',
            fileType: 'figma',
            status: 'REVISION REQUESTED',
            statusType: 'revisions',
            version: 'v1.0',
            clientContact: p3?.clientName || 'Elevate Creative Co.',
            accentColor: '#ffb95f',
            sentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          },
          {
            workspaceId,
            projectId: p4?.id || null,
            title: 'Vanguard Fleet Route Optimization Next.js Bundle',
            fileName: 'Vanguard_Fleet_Tracking_Production_v3.0.zip',
            fileType: 'zip',
            status: 'APPROVED',
            statusType: 'approved',
            version: 'v3.0',
            clientContact: p4?.clientName || 'Vanguard Logistics',
            accentColor: '#4edea3',
            sentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      deliverables = await prisma.deliverable.findMany({
        where: { workspaceId },
        include: {
          project: { select: { title: true, clientName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

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
        ? 'Client requested 3 changes: 1. Darken the primary navigation bar to match brand charcoal, 2. Increase padding on property card pricing, 3. Add direct WhatsApp booking button on mobile header.'
        : d.status === 'APPROVED'
        ? 'Deliverable officially approved by client without conditions. Ready for production deployment.'
        : 'Submitted for client sign-off. Awaiting feedback from key stakeholders.',
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
