import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';
import { buildLeadContext } from '@/lib/ai/context/lead-context';
import { buildLeadIntelligencePrompt } from '@/lib/ai/prompts/lead-intelligence.prompt';
import { aiService } from '@/lib/ai/ai-service';
import { LeadIntelligenceSchema, LeadIntelligence } from '@/lib/ai/schemas/lead-intelligence.schema';
import {
  AiValidationError,
  AiMalformedOutputError,
  AiProviderUnavailableError,
  AiTimeoutError,
  AiRateLimitError,
  AiConfigurationError,
  AiAuthenticationError,
} from '@/lib/ai/errors';

const analyzeRequestSchema = z.object({
  customInstructions: z.string().optional(),
  provider: z.enum(['mock', 'openai', 'anthropic', 'gemini', 'huggingface']).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate session & enforce strict workspace boundaries
    const session = await getAuthSession(request);
    const { id: leadId } = await params;
    const ip = getClientIp(request);

    // 2. Distributed Rate Limiting (60 requests/min per workspace)
    const rateLimit = await checkRateLimit(
      `${session.workspaceId}:${ip}`,
      'ai-lead-intelligence',
      60,
      60
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.retryAfterSeconds,
        'AI intelligence rate limit reached. Please wait before analyzing additional leads.'
      );
    }

    // 3. Parse input body
    const body = await request.json().catch(() => ({}));
    const validated = analyzeRequestSchema.parse(body);

    // 4. Verify workspace AI settings & lead ownership
    const [workspace, existingLead] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: session.workspaceId },
        select: { aiLeadAnalysisEnabled: true, aiProvider: true },
      }),
      prisma.lead.findFirst({
        where: {
          id: leadId,
          workspaceId: session.workspaceId,
        },
      }),
    ]);

    if (!workspace?.aiLeadAnalysisEnabled) {
      return NextResponse.json(
        { success: false, error: { message: 'AI Lead Analysis is disabled in your workspace settings.' } },
        { status: 403 }
      );
    }

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: { message: 'Lead not found in current workspace.' } },
        { status: 404 }
      );
    }

    // 5. Build sanitized, workspace-isolated LeadContext
    const leadContext = await buildLeadContext(leadId, session);

    // 6. Build structured LeadIntelligence prompt
    const prompt = buildLeadIntelligencePrompt(leadContext, validated.customInstructions);

    // 7. Resolve provider from request or workspace preference
    const resolvedProvider =
      validated.provider ||
      (workspace.aiProvider && workspace.aiProvider !== 'system' ? (workspace.aiProvider as any) : undefined);

    // 8. Execute AI structured generation via provider-independent AiService
    const aiResult = await aiService.generateStructured<LeadIntelligence>({
      provider: resolvedProvider,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      schema: LeadIntelligenceSchema,
    });

    const intelligence = aiResult.data;

    // 8. Auto-advance lead to QUALIFIED if high intent/score and currently in NEW stage
    const nextStatus =
      existingLead.status === 'NEW' && intelligence.score >= 70
        ? 'QUALIFIED'
        : existingLead.status;

    // 9. Persist analysis & update Lead record in a transactional boundary
    const [savedAnalysis, updatedLead] = await prisma.$transaction([
      prisma.leadAiAnalysis.create({
        data: {
          workspaceId: session.workspaceId,
          leadId,
          score: intelligence.score,
          qualification: intelligence.qualification,
          companySummary: intelligence.companySummary,
          likelyPainPoints: intelligence.likelyPainPoints,
          recommendedServices: intelligence.recommendedServices,
          recommendedPitch: intelligence.recommendedPitch,
          reasoning: intelligence.reasoning,
          confidence: intelligence.confidence,
          provider: aiResult.provider,
          model: aiResult.model,
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: {
          leadScore: intelligence.score,
          aiSummary: intelligence.companySummary,
          status: nextStatus,
        },
      }),
      // Log timeline activity note
      prisma.activity.create({
        data: {
          workspaceId: session.workspaceId,
          userId: session.userId,
          leadId,
          type: 'NOTE',
          content: `🧠 AI Intelligence Diagnostic (${intelligence.qualification.toUpperCase()} - Score: ${intelligence.score}/100):\n• Pitch: ${intelligence.recommendedPitch}\n• Reasoning: ${intelligence.reasoning}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        analysisId: savedAnalysis.id,
        leadId,
        score: intelligence.score,
        qualification: intelligence.qualification,
        companySummary: intelligence.companySummary,
        likelyPainPoints: intelligence.likelyPainPoints,
        recommendedServices: intelligence.recommendedServices,
        recommendedPitch: intelligence.recommendedPitch,
        reasoning: intelligence.reasoning,
        confidence: intelligence.confidence,
        status: updatedLead.status,
        provider: aiResult.provider,
        model: aiResult.model,
        usage: aiResult.usage,
        latencyMs: aiResult.latencyMs,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }

    if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
      return NextResponse.json(
        { success: false, error: { message: error.message || 'Unauthorized' } },
        { status: 401 }
      );
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: { message: error.message || 'Forbidden' } },
        { status: 403 }
      );
    }

    if (error instanceof AiValidationError || error instanceof AiMalformedOutputError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: 'AI generated invalid structured intelligence output.' },
        },
        { status: 502 }
      );
    }

    if (error instanceof AiTimeoutError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: 'AI request timed out. Please retry.' } },
        { status: 504 }
      );
    }

    if (error instanceof AiRateLimitError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: 'AI provider rate limit exceeded.' } },
        { status: 429 }
      );
    }

    if (error instanceof AiProviderUnavailableError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: 'AI service temporarily unavailable.' } },
        { status: 503 }
      );
    }

    if (error instanceof AiConfigurationError || error instanceof AiAuthenticationError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: 'AI provider configuration error.' } },
        { status: 500 }
      );
    }

    console.error('[AI Analyze Lead API Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
