import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const [
      teamCount,
      leadsCount,
      dealsCount,
      contactsCount,
      companiesCount,
      tasksCount,
      aiAnalysesCount,
      emailsSentCount,
      filesCount,
      workspace,
    ] = await Promise.all([
      prisma.user.count({ where: { workspaceId } }),
      prisma.lead.count({ where: { workspaceId } }),
      prisma.deal.count({ where: { workspaceId } }),
      prisma.contact.count({ where: { workspaceId } }),
      prisma.company.count({ where: { workspaceId } }),
      prisma.task.count({ where: { workspaceId } }),
      prisma.leadAiAnalysis.count({ where: { workspaceId } }),
      prisma.outreachEmail.count({ where: { workspaceId, status: 'SENT' } }),
      prisma.fileRecord.count({ where: { workspaceId } }),
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          name: workspace?.name,
          memberSince: workspace?.createdAt,
          tierName: 'Agency Enterprise (Self-Hosted)',
          status: 'ACTIVE',
        },
        usage: {
          teamMembers: {
            current: teamCount,
            limit: null, // Unlimited in self-hosted
          },
          crmRecords: {
            leads: leadsCount,
            deals: dealsCount,
            contacts: contactsCount,
            companies: companiesCount,
            tasks: tasksCount,
            total: leadsCount + dealsCount + contactsCount + companiesCount + tasksCount,
          },
          aiAutomation: {
            totalAnalyses: aiAnalysesCount,
            outreachSent: emailsSentCount,
          },
          storage: {
            fileCount: filesCount,
            estimatedBytes: filesCount * 250000, // ~250KB average estimate
          },
        },
        paymentConnector: {
          status: 'NOT_CONNECTED',
          label: 'External Billing Connector (Stripe / LemonSqueezy)',
          note: 'Future Integration Connector — No external payment processor currently bound to this workspace.',
        },
      },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
