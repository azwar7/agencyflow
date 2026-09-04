import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const [deals, leads, projects, invoices, urgentTasks, recentActivities] = await Promise.all([
      prisma.deal.findMany({
        where: { workspaceId },
        select: {
          id: true,
          title: true,
          value: true,
          stage: true,
          createdAt: true,
          company: { select: { name: true } },
          contact: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.lead.findMany({
        where: { workspaceId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
          leadScore: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        where: { workspaceId },
        select: {
          id: true,
          title: true,
          clientName: true,
          progress: true,
          status: true,
          dueDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { workspaceId },
        select: {
          id: true,
          number: true,
          client: true,
          amount: true,
          status: true,
          dueDate: true,
        },
      }),
      prisma.task.findMany({
        where: { workspaceId, status: { not: 'COMPLETED' } },
        take: 6,
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          title: true,
          dueDate: true,
          priority: true,
          status: true,
          assignedTo: { select: { fullName: true } },
        },
      }),
      prisma.activity.findMany({
        where: { workspaceId },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          content: true,
          createdAt: true,
          user: { select: { fullName: true } },
        },
      }),
    ]);

    // Calculations based strictly on real database values
    const activeDeals = deals.filter((d) => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST');
    const closedWonDeals = deals.filter((d) => d.stage === 'CLOSED_WON');
    const closedLostDeals = deals.filter((d) => d.stage === 'CLOSED_LOST');

    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const totalClosed = closedWonDeals.length + closedLostDeals.length;
    const winRate = totalClosed > 0 ? Math.round((closedWonDeals.length / totalClosed) * 100) : 0;

    // Real invoice metrics
    const unpaidInvoices = invoices.filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE');
    const outstandingInvoicesAmount = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const awaitingInvoicesCount = unpaidInvoices.length;

    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
    const monthlyRevenue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

    // Real active projects metrics
    const activeProjects = projects.filter((p) => p.status !== 'COMPLETED');
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const projectsDueThisWeek = projects.filter((p) => p.dueDate && new Date(p.dueDate) <= oneWeekFromNow && p.status !== 'COMPLETED').length;

    // Real leads categorized by status
    const newLeads = leads.filter((l) => l.status === 'NEW' || l.status === 'UNQUALIFIED');
    const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'CONTACTED');
    const proposalDeals = deals.filter((d) => d.stage === 'PROPOSAL' || d.stage === 'DISCOVERY');
    const negotiationDeals = deals.filter((d) => d.stage === 'NEGOTIATION');

    return NextResponse.json({
      success: true,
      data: {
        workspaceName: session.agencyName,
        persona: session.persona || 'AGENCY',
        metrics: {
          totalPipelineValue,
          activeDealsCount: activeDeals.length,
          activeProjectsCount: activeProjects.length,
          projectsDueThisWeek,
          outstandingInvoicesAmount,
          awaitingInvoicesCount,
          monthlyRevenue,
          winRate,
          totalLeads: leads.length,
          closedWonCount: closedWonDeals.length,
        },
        pipeline: {
          newLeads,
          qualifiedLeads,
          proposalDeals,
          negotiationDeals,
          closedWonCount: closedWonDeals.length,
        },
        projects,
        urgentTasks,
        recentActivities,
      },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch dashboard' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
