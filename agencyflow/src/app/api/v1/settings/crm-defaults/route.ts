import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

export const STANDARD_LEAD_SOURCES = [
  'Website Inbound',
  'LinkedIn Outreach',
  'Cold Email',
  'Client Referral',
  'Strategic Partner',
  'Paid Search / Ads',
  'Conference / Event',
];

export const STANDARD_LEAD_STATUSES = [
  { key: 'NEW', label: 'New Lead', color: '#38bdf8' },
  { key: 'CONTACTED', label: 'Contacted', color: '#8b5cf6' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#10b981' },
  { key: 'UNQUALIFIED', label: 'Unqualified', color: '#94a3b8' },
  { key: 'CONVERTED', label: 'Converted to Client', color: '#f59e0b' },
];

export const STANDARD_LOSS_REASONS = [
  'Price / Budget too high',
  'Competitor selected',
  'Project cancelled / Postponed',
  'Lack of feature / Capability',
  'No response / Ghosted',
  'Poor timing',
];

const crmDefaultsSchema = z.object({
  leadSources: z.array(z.string().min(1)).optional(),
  leadStatuses: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        color: z.string(),
      })
    )
    .optional(),
  defaultLeadOwnerId: z.string().nullable().optional(),
  leadAssignmentRule: z.enum(['MANUAL', 'ROUND_ROBIN', 'DEFAULT_OWNER']).optional(),
  duplicateLeadDetection: z.enum(['OFF', 'EMAIL_ONLY', 'EMAIL_AND_PHONE']).optional(),
  dealLossReasons: z.array(z.string().min(1)).optional(),
  dealRequiredFields: z.array(z.string().min(1)).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: {
        leadSources: true,
        leadStatuses: true,
        defaultLeadOwnerId: true,
        leadAssignmentRule: true,
        duplicateLeadDetection: true,
        dealLossReasons: true,
        dealRequiredFields: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const leadSources = (workspace.leadSources as string[]) || STANDARD_LEAD_SOURCES;
    const leadStatuses = (workspace.leadStatuses as any[]) || STANDARD_LEAD_STATUSES;
    const dealLossReasons = (workspace.dealLossReasons as string[]) || STANDARD_LOSS_REASONS;
    const dealRequiredFields = (workspace.dealRequiredFields as string[]) || ['title', 'value'];

    return NextResponse.json({
      success: true,
      data: {
        leadSources,
        leadStatuses,
        defaultLeadOwnerId: workspace.defaultLeadOwnerId,
        leadAssignmentRule: workspace.leadAssignmentRule,
        duplicateLeadDetection: workspace.duplicateLeadDetection,
        dealLossReasons,
        dealRequiredFields,
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

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = crmDefaultsSchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: session.workspaceId },
      data: validated,
      select: {
        leadSources: true,
        leadStatuses: true,
        defaultLeadOwnerId: true,
        leadAssignmentRule: true,
        duplicateLeadDetection: true,
        dealLossReasons: true,
        dealRequiredFields: true,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'CRM_DEFAULTS_UPDATE',
      entityType: 'Workspace',
      entityId: session.workspaceId,
      metadata: validated,
    });

    return NextResponse.json({
      success: true,
      message: 'CRM defaults and lead configuration updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update CRM defaults' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
