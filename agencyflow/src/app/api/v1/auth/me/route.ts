import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    // Get workspace with counts strictly scoped to the session's workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      include: {
        _count: {
          select: {
            leads: true,
            deals: true,
            companies: true,
            projects: true,
            deliverables: true,
            invoices: true,
            tasks: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const hasAnyData =
      workspace._count.leads > 0 ||
      workspace._count.deals > 0 ||
      workspace._count.companies > 0 ||
      workspace._count.projects > 0 ||
      workspace._count.deliverables > 0 ||
      workspace._count.invoices > 0;

    // Check if sample data is loaded
    const sampleLeadCount = await prisma.lead.count({
      where: { workspaceId: workspace.id, isSample: true },
    });

    const isSampleData = sampleLeadCount > 0;

    // Checklist item completion status
    const checklist = {
      hasClient: workspace._count.companies > 0,
      hasDealOrLead: workspace._count.deals > 0 || workspace._count.leads > 0,
      hasDeliverableOrProject: workspace._count.deliverables > 0 || workspace._count.projects > 0,
      hasTask: workspace._count.tasks > 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: session.userId,
          email: session.email,
          name: session.fullName,
          role: session.role,
          agency: session.agencyName,
          workspaceId: session.workspaceId,
          isFirstLogin: false,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          counts: workspace._count,
          hasAnyData,
          isSampleData,
          checklist,
        },
      },
    });
  } catch (error: any) {
    const response = NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: 401 }
    );
    response.cookies.set('agencyflow_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }
}
