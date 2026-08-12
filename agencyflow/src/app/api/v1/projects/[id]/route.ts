import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultProjects } from '../route';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check baseline default projects first
    const defaultMatch = defaultProjects.find((p) => p.id === id);
    if (defaultMatch) {
      return NextResponse.json({ success: true, data: defaultMatch });
    }

    // Query Prisma Deal
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        assignedTo: true,
        activities: { orderBy: { createdAt: 'desc' } },
        tasks: true,
      },
    });

    if (deal) {
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
    }

    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch project' }, { status: 500 });
  }
}
