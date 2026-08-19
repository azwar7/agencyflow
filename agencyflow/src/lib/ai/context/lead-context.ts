import { prisma } from '@/lib/prisma';
import { SessionData } from '@/lib/auth-session';
import {
  sanitizeString,
  sanitizeDate,
  sanitizeNumber,
  sanitizeList,
  CONTEXT_LIMITS,
} from './sanitize';

export interface LeadContext {
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string | null;
    companyName: string | null;
    status: string;
    source: string;
    leadScore: number;
    aiSummary: string | null;
    createdAt: string;
    assignedRep: {
      fullName: string;
      role: string;
    } | null;
  };
  activities: Array<{
    id: string;
    type: string;
    content: string;
    createdAt: string;
    loggedBy: string | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
  }>;
  company: {
    name: string;
    domain: string | null;
    industry: string | null;
  } | null;
  metadata: {
    workspaceId: string;
    extractedAt: string;
  };
}

/**
 * Builds a sanitized, workspace-isolated CRM Lead Context for AI intelligence features.
 * Strictly enforces tenant boundaries via session.workspaceId.
 */
export async function buildLeadContext(
  leadId: string,
  session: SessionData
): Promise<LeadContext> {
  if (!leadId || !session?.workspaceId) {
    throw new Error('leadId and trusted session workspaceId are required to build lead context.');
  }

  const workspaceId = session.workspaceId;

  // 1. Fetch lead strictly scoped to authenticated workspace
  const leadRecord = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      companyName: true,
      status: true,
      source: true,
      leadScore: true,
      aiSummary: true,
      createdAt: true,
      assignedTo: {
        select: {
          fullName: true,
          role: true,
        },
      },
      activities: {
        take: CONTEXT_LIMITS.MAX_ACTIVITIES,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
      tasks: {
        take: CONTEXT_LIMITS.MAX_TASKS,
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });

  if (!leadRecord) {
    throw new Error(`Lead "${leadId}" not found in current workspace.`);
  }

  // 2. Fetch matched company details if companyName exists
  let companyData: LeadContext['company'] = null;
  if (leadRecord.companyName) {
    const companyRecord = await prisma.company.findFirst({
      where: {
        workspaceId,
        name: leadRecord.companyName,
      },
      select: {
        name: true,
        domain: true,
        industry: true,
      },
    });

    if (companyRecord) {
      companyData = {
        name: sanitizeString(companyRecord.name, 100),
        domain: companyRecord.domain ? sanitizeString(companyRecord.domain, 100) : null,
        industry: companyRecord.industry ? sanitizeString(companyRecord.industry, 100) : null,
      };
    }
  }

  // 3. Assemble and sanitize the typed context object
  const firstName = sanitizeString(leadRecord.firstName, 60, 'Unknown');
  const lastName = sanitizeString(leadRecord.lastName, 60, '');
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    lead: {
      id: leadRecord.id,
      firstName,
      lastName,
      fullName,
      email: sanitizeString(leadRecord.email, 120),
      phone: leadRecord.phone ? sanitizeString(leadRecord.phone, 30) : null,
      companyName: leadRecord.companyName ? sanitizeString(leadRecord.companyName, 100) : null,
      status: sanitizeString(leadRecord.status, 30, 'NEW'),
      source: sanitizeString(leadRecord.source, 60, 'Inbound'),
      leadScore: sanitizeNumber(leadRecord.leadScore, 0, 0, 100),
      aiSummary: leadRecord.aiSummary ? sanitizeString(leadRecord.aiSummary, CONTEXT_LIMITS.MAX_SUMMARY_LENGTH) : null,
      createdAt: sanitizeDate(leadRecord.createdAt) || new Date().toISOString(),
      assignedRep: leadRecord.assignedTo
        ? {
            fullName: sanitizeString(leadRecord.assignedTo.fullName, 80),
            role: sanitizeString(leadRecord.assignedTo.role, 30),
          }
        : null,
    },
    activities: sanitizeList(leadRecord.activities, CONTEXT_LIMITS.MAX_ACTIVITIES, (act) => ({
      id: act.id,
      type: sanitizeString(act.type, 30, 'NOTE'),
      content: sanitizeString(act.content, CONTEXT_LIMITS.MAX_NOTE_LENGTH),
      createdAt: sanitizeDate(act.createdAt) || new Date().toISOString(),
      loggedBy: act.user ? sanitizeString(act.user.fullName, 80) : null,
    })),
    tasks: sanitizeList(leadRecord.tasks, CONTEXT_LIMITS.MAX_TASKS, (t) => ({
      id: t.id,
      title: sanitizeString(t.title, 150),
      priority: sanitizeString(t.priority, 20, 'MEDIUM'),
      status: sanitizeString(t.status, 20, 'PENDING'),
      dueDate: sanitizeDate(t.dueDate),
    })),
    company: companyData,
    metadata: {
      workspaceId,
      extractedAt: new Date().toISOString(),
    },
  };
}
