import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;

    // Query Prisma Deal strictly scoped to authenticated workspace to prevent cross-tenant IDOR
    const deal = await prisma.deal.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
      include: {
        company: true,
        contact: true,
        assignedTo: true,
        activities: { orderBy: { createdAt: 'desc' } },
        tasks: true,
      },
    });

    if (!deal) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const projectData = {
      id: deal.id,
      clientName: deal.company?.name || 'Agency Account Client',
      title: deal.title,
      status: deal.stage === 'CLOSED_WON' ? 'ON TRACK' : 'AT RISK',
      statusType: deal.stage === 'CLOSED_WON' ? 'success' : 'warning',
      progress: deal.stage === 'CLOSED_WON' ? 85 : 42,
      nextMilestone: 'Quarterly Strategic Audit & Review',
      dueDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Aug 28, 2026',
      team: deal.assignedTo
        ? [{ name: deal.assignedTo.fullName, avatar: deal.assignedTo.fullName.split(' ').map((n) => n[0]).join(''), role: 'Project Owner', color: 'var(--primary)' }]
        : [{ name: 'Sarah Jenkins', avatar: 'SJ', role: 'Lead Architect', color: 'var(--primary)' }],
      budget: `$${deal.value.toLocaleString()}`,
      deliverables: [
        { id: 'del-101', title: `${deal.title} - Scope & SRS Document`, status: 'COMPLETED', date: 'Aug 05, 2026' },
        { id: 'del-102', title: `${deal.title} - Core Development & Testing`, status: 'IN_PROGRESS', date: 'Aug 20, 2026' },
      ],
      milestones: [
        { id: 'ms-1', title: 'Project Kickoff & Alignment', date: 'Aug 01', completed: true },
        { id: 'ms-2', title: 'Feature Delivery & Integration', date: 'Aug 20', completed: false },
      ],
      activities: deal.activities.map((act) => ({
        id: act.id,
        user: deal.assignedTo?.fullName || 'Project Admin',
        action: act.content,
        time: new Date(act.createdAt).toLocaleDateString(),
      })),
    };

    return NextResponse.json({ success: true, data: projectData });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch project' },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
