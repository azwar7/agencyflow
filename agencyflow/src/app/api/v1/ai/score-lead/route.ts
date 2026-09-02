import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';
import { buildLeadContext } from '@/lib/ai/context/lead-context';
import { buildLeadAnalysisPrompt } from '@/lib/ai/prompts/lead-analysis.prompt';
import { aiService } from '@/lib/ai/ai-service';
import { LeadAnalysisSchema, LeadAnalysis } from '@/lib/ai/schemas/lead-analysis.schema';
import {
  AiBaseError,
  AiValidationError,
  AiMalformedOutputError,
  AiProviderUnavailableError,
  AiTimeoutError,
  AiRateLimitError,
  AiConfigurationError,
  AiAuthenticationError,
} from '@/lib/ai/errors';

const scoreLeadRequestSchema = z.object({
  leadId: z.string().min(1, 'leadId is required'),
  customInstructions: z.string().optional(),
  provider: z.enum(['mock', 'openai', 'anthropic', 'gemini', 'huggingface']).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate session & establish authoritative workspace boundary
    const session = await getAuthSession(request);
    const ip = getClientIp(request);

    // 2. Distributed Rate Limiting: Max 60 AI evaluations per minute per workspace
    const rateLimit = await checkRateLimit(
      `${session.workspaceId}:${ip}`,
      'ai-score-lead',
      60,
      60
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.retryAfterSeconds,
        'AI evaluation rate limit reached. Please wait before generating additional evaluations.'
      );
    }

    // 3. Parse and validate input request body
    const body = await request.json().catch(() => ({}));
    const validated = scoreLeadRequestSchema.parse(body);
    const leadId = validated.leadId;

    // 4. Verify workspace AI settings
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: { aiLeadScoringEnabled: true, aiProvider: true },
    });

    if (!workspace?.aiLeadScoringEnabled) {
      return NextResponse.json(
        { success: false, error: { message: 'AI Lead Scoring is disabled in your workspace settings.' } },
        { status: 403 }
      );
    }

    // 5. Build sanitized, workspace-isolated LeadContext (strictly scoped to session.workspaceId)
    const leadContext = await buildLeadContext(leadId, session);

    // 6. Build versioned LeadAnalysisPrompt with prompt injection isolation
    const prompt = buildLeadAnalysisPrompt(leadContext, validated.customInstructions);

    // 7. Resolve provider
    const resolvedProvider =
      validated.provider ||
      (workspace.aiProvider && workspace.aiProvider !== 'system' ? (workspace.aiProvider as any) : undefined);

    // 8. Execute structured AI generation via provider-independent AiService
    const aiResult = await aiService.generateStructured<LeadAnalysis>({
      provider: resolvedProvider,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      schema: LeadAnalysisSchema,
    });

    const analysis = aiResult.data;

    // 7. Persist validated AI analysis to database
    await prisma.lead.update({
      where: {
        id: leadId,
        workspaceId: session.workspaceId,
      },
      data: {
        leadScore: analysis.score,
        aiSummary: analysis.summary,
      },
    });

    // 8. Return structured AI analysis response
    return NextResponse.json({
      success: true,
      data: {
        leadId,
        score: analysis.score,
        summary: analysis.summary,
        strengths: analysis.strengths,
        risks: analysis.risks,
        recommendedNextAction: analysis.recommendedNextAction,
        confidence: analysis.confidence,
        provider: aiResult.provider,
        model: aiResult.model,
        usage: aiResult.usage,
        latencyMs: aiResult.latencyMs,
        // Backward-compatibility alias for legacy UI components
        insights: analysis.strengths,
      },
    });
  } catch (error: any) {
    // 1. Zod Request Body Validation Errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }

    // 2. Authentication & Authorization Errors
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

    // 3. Lead Not Found / Cross-Tenant Access Rejection
    if (error.message?.includes('not found') || error.message?.includes('Lead "')) {
      return NextResponse.json(
        { success: false, error: { message: 'Lead not found in current workspace' } },
        { status: 404 }
      );
    }

    // 4. Normalized AI Errors
    if (error instanceof AiValidationError || error instanceof AiMalformedOutputError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'AI provider generated an invalid structured response.',
          },
        },
        { status: 502 }
      );
    }

    if (error instanceof AiTimeoutError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'AI provider request timed out. Please retry.',
          },
        },
        { status: 504 }
      );
    }

    if (error instanceof AiRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'AI provider rate limit exceeded. Please retry shortly.',
          },
        },
        { status: 429 }
      );
    }

    if (error instanceof AiProviderUnavailableError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'AI service is temporarily unavailable. Please retry shortly.',
          },
        },
        { status: 503 }
      );
    }

    if (error instanceof AiConfigurationError || error instanceof AiAuthenticationError) {
      console.error('[score-lead API] AI provider configuration error:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'AI service configuration error. Please contact administrator.',
          },
        },
        { status: 500 }
      );
    }

    // 5. Generic Unexpected Errors
    console.error('[score-lead API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
