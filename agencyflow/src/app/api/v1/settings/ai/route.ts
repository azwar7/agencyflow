import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { aiService } from '@/lib/ai/ai-service';
import { logAuditEvent } from '@/lib/audit';

const updateAiSettingsSchema = z.object({
  aiProvider: z.string().optional(),
  aiLeadAnalysisEnabled: z.boolean().optional(),
  aiLeadScoringEnabled: z.boolean().optional(),
  aiEmailGenerationEnabled: z.boolean().optional(),
  aiFollowUpSuggestionsEnabled: z.boolean().optional(),
  aiAutoAnalyzeLeads: z.boolean().optional(),
  aiModelTemperature: z.number().min(0).max(1).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    // 1. Fetch workspace AI settings
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: {
        aiProvider: true,
        aiLeadAnalysisEnabled: true,
        aiLeadScoringEnabled: true,
        aiEmailGenerationEnabled: true,
        aiFollowUpSuggestionsEnabled: true,
        aiAutoAnalyzeLeads: true,
        aiModelTemperature: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    // 2. Query configured providers from server-side AiService
    const configuredProviders = aiService.getConfiguredProviders();
    const defaultSystemProvider = aiService.getDefaultProviderName();

    // 3. Aggregate real usage metrics from LeadAiAnalysis and OutreachEmail
    const [totalAnalyses, analysesByProvider, totalEmails, successfulEmails, failedEmails] = await Promise.all([
      prisma.leadAiAnalysis.count({
        where: { workspaceId: session.workspaceId },
      }),
      prisma.leadAiAnalysis.groupBy({
        by: ['provider'],
        where: { workspaceId: session.workspaceId },
        _count: { _all: true },
      }),
      prisma.outreachEmail.count({
        where: { workspaceId: session.workspaceId },
      }),
      prisma.outreachEmail.count({
        where: { workspaceId: session.workspaceId, status: 'SENT' },
      }),
      prisma.outreachEmail.count({
        where: { workspaceId: session.workspaceId, status: 'FAILED' },
      }),
    ]);

    const providerCounts: Record<string, number> = {};
    for (const item of analysesByProvider) {
      providerCounts[item.provider] = item._count._all;
    }

    return NextResponse.json({
      success: true,
      data: {
        settings: workspace,
        configuredProviders,
        defaultSystemProvider,
        usage: {
          totalAnalyses,
          providerCounts,
          totalEmails,
          successfulEmails,
          failedEmails,
          successRate: totalEmails > 0 ? Math.round((successfulEmails / totalEmails) * 100) : 100,
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

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = updateAiSettingsSchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: session.workspaceId },
      data: validated,
      select: {
        aiProvider: true,
        aiLeadAnalysisEnabled: true,
        aiLeadScoringEnabled: true,
        aiEmailGenerationEnabled: true,
        aiFollowUpSuggestionsEnabled: true,
        aiAutoAnalyzeLeads: true,
        aiModelTemperature: true,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'AI_SETTINGS_UPDATE',
      entityType: 'Workspace',
      entityId: session.workspaceId,
      metadata: validated,
    });

    return NextResponse.json({
      success: true,
      message: 'AI feature toggles and provider preferences saved successfully.',
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
      { success: false, error: { message: error.message || 'Failed to update AI settings' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
