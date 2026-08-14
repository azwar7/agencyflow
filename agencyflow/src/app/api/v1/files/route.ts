import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const files = await prisma.fileRecord.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = files.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      category: f.category,
      client: f.client,
      project: f.project || undefined,
      uploadedBy: f.uploadedBy,
      uploadedDate: f.createdAt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
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

    const newFile = await prisma.fileRecord.create({
      data: {
        workspaceId,
        name: body.name || 'document_upload.pdf',
        type: body.type || 'PDF',
        size: body.size || '2.4 MB',
        category: body.category || 'Deliverable',
        client: body.client || 'Client Organization',
        project: body.project || null,
        uploadedBy: session.fullName,
      },
    });

    return NextResponse.json({ success: true, data: newFile }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await prisma.fileRecord.deleteMany({ where: { id, workspaceId } });
    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
