import { prisma } from '@/lib/prisma';
import { SessionData } from '@/lib/auth-session';
import {
  sanitizeString,
  sanitizeDate,
  sanitizeNumber,
  sanitizeList,
  CONTEXT_LIMITS,
} from './sanitize';

export interface WorkspaceContext {
  workspace: {
    id: string;
    name: string;
  };
  metrics: {
    totalLeads: number;
    activeDealsCount: number;
    pipelineValue: number;
    openTasksCount: number;
  };
  recentDeals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    companyName: string | null;
  }>;
  urgentTasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
  }>;
  metadata: {
    workspaceId: string;
    extractedAt: string;
  };
}

/**
 * Builds a lightweight, workspace-scoped overview context for AI Copilot queries.
 * Strictly queries records where workspaceId === session.workspaceId.
 */
export async function buildWorkspaceContext(
  session: SessionData
): Promise<WorkspaceContext> {
  if (!session?.workspaceId) {
    throw new Error('Trusted session workspaceId is required to build workspace context.');
  }

  const workspaceId = session.workspaceId;

  // Parallelize lightweight aggregate and recent record queries
  const [workspace, leadsCount, deals, openTasksCount, urgentTasks] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    }),
    prisma.lead.count({
      where: { workspaceId },
    }),
    prisma.deal.findMany({
      where: { workspaceId },
      take: CONTEXT_LIMITS.MAX_DEALS,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        company: { select: { name: true } },
      },
    }),
    prisma.task.count({
      where: { workspaceId, status: 'PENDING' },
    }),
    prisma.task.findMany({
      where: { workspaceId, status: 'PENDING' },
      take: 5,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
      },
    }),
  ]);

  if (!workspace) {
    throw new Error(`Workspace "${workspaceId}" not found.`);
  }

  const activeDeals = deals.filter((d) => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST');
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  return {
    workspace: {
      id: workspaceId,
      name: sanitizeString(workspace.name, 100, 'Agency Workspace'),
    },
    metrics: {
      totalLeads: leadsCount,
      activeDealsCount: activeDeals.length,
      pipelineValue: sanitizeNumber(pipelineValue, 0),
      openTasksCount,
    },
    recentDeals: sanitizeList(deals, CONTEXT_LIMITS.MAX_DEALS, (deal) => ({
      id: deal.id,
      title: sanitizeString(deal.title, 100),
      value: sanitizeNumber(deal.value, 0),
      stage: sanitizeString(deal.stage, 30),
      companyName: deal.company ? sanitizeString(deal.company.name, 80) : null,
    })),
    urgentTasks: sanitizeList(urgentTasks, 5, (t) => ({
      id: t.id,
      title: sanitizeString(t.title, 120),
      priority: sanitizeString(t.priority, 20, 'MEDIUM'),
      dueDate: sanitizeDate(t.dueDate),
    })),
    metadata: {
      workspaceId,
      extractedAt: new Date().toISOString(),
    },
  };
}
