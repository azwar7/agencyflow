import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';
import { buildLeadContext } from '@/lib/ai/context/lead-context';
import { buildEmailGenerationPrompt } from '@/lib/ai/prompts/email-generation.prompt';
import { aiService } from '@/lib/ai/ai-service';
import { EmailGenerationSchema, EmailGeneration } from '@/lib/ai/schemas/email-generation.schema';
import { LeadIntelligence } from '@/lib/ai/schemas/lead-intelligence.schema';
import {
  AiValidationError,
  AiMalformedOutputError,
  AiProviderUnavailableError,
  AiTimeoutError,
  AiRateLimitError,
} from '@/lib/ai/errors';

const generateEmailSchema = z.object({
  tone: z.enum(['professional', 'conversational', 'direct']).default('professional'),
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

    // 2. Distributed Rate Limiting (40 requests/min per workspace)
    const rateLimit = await checkRateLimit(
      `${session.workspaceId}:${ip}`,
      'ai-generate-email',
      40,
      60
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.retryAfterSeconds,
        'Email generation rate limit reached. Please wait before generating additional outreach emails.'
      );
    }

    // 3. Parse input body
    const body = await request.json().catch(() => ({}));
    const validated = generateEmailSchema.parse(body);

    // 4. Verify lead exists and belongs strictly to authenticated workspace
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId: session.workspaceId,
      },
      include: {
        workspace: { select: { name: true } },
        assignedTo: { select: { fullName: true } },
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: { message: 'Lead not found in current workspace.' } },
        { status: 404 }
      );
    }

    // 5. Fetch latest AI analysis if available
    const latestAnalysis = await prisma.leadAiAnalysis.findFirst({
      where: {
        leadId,
        workspaceId: session.workspaceId,
      },
      orderBy: { createdAt: 'desc' },
    });

    let intelligenceData: LeadIntelligence | null = null;
    if (latestAnalysis) {
      intelligenceData = {
        score: latestAnalysis.score,
        qualification: latestAnalysis.qualification as 'hot' | 'warm' | 'cold',
        companySummary: latestAnalysis.companySummary,
        likelyPainPoints: (latestAnalysis.likelyPainPoints as string[]) || [],
        recommendedServices: (latestAnalysis.recommendedServices as string[]) || [],
        recommendedPitch: latestAnalysis.recommendedPitch,
        reasoning: latestAnalysis.reasoning,
        confidence: latestAnalysis.confidence,
      };
    }

    // 6. Build sanitized LeadContext
    const leadContext = await buildLeadContext(leadId, session);

    // 7. Build prompt for human-sounding, anti-spam cold outreach
    const prompt = buildEmailGenerationPrompt({
      context: leadContext,
      intelligence: intelligenceData,
      tone: validated.tone,
      customInstructions: validated.customInstructions,
      senderName: existingLead.assignedTo?.fullName || session.fullName || 'Alex Sterling',
      agencyName: existingLead.workspace?.name || 'AgencyFlow',
    });

    // 8. Execute AI generation
    const aiResult = await aiService.generateStructured<EmailGeneration>({
      provider: validated.provider,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      schema: EmailGenerationSchema,
    });

    const emailData = aiResult.data;

    // 9. Persist outreach email in DRAFT state (human approval required before sending)
    const savedOutreach = await prisma.outreachEmail.create({
      data: {
        workspaceId: session.workspaceId,
        leadId,
        subject: emailData.subject,
        body: emailData.body,
        callToAction: emailData.callToAction,
        recommendedService: emailData.recommendedService,
        personalizationPoints: emailData.personalizationPoints,
        status: 'DRAFT',
        tone: validated.tone,
        metadata: {
          provider: aiResult.provider,
          model: aiResult.model,
          latencyMs: aiResult.latencyMs,
          usage: {
            promptTokens: aiResult.usage.promptTokens,
            completionTokens: aiResult.usage.completionTokens,
            totalTokens: aiResult.usage.totalTokens,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: savedOutreach,
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
          error: { code: error.code, message: 'AI generated invalid email output.' },
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

    console.error('[AI Generate Email API Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
