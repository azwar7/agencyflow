import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';
import { aiService } from '@/lib/ai/ai-service';
import { buildProposalGenerationPrompt } from '@/lib/ai/prompts/proposal-generation.prompt';
import { ProposalGenerationSchema, ProposalGeneration } from '@/lib/ai/schemas/proposal-generation.schema';

const generateProposalRequestSchema = z.object({
  leadId: z.string().optional(),
  clientName: z.string().optional(),
  budget: z.number().min(500).max(5_000_000).optional().default(24000),
  timelineWeeks: z.number().min(1).max(52).optional().default(6),
  customScope: z.string().optional(),
  provider: z.enum(['mock', 'openai', 'anthropic', 'gemini', 'huggingface']).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const ip = getClientIp(request);

    // Rate limiting: 20 proposals per minute per workspace
    const rateLimit = await checkRateLimit(
      `${session.workspaceId}:${ip}`,
      'ai-generate-proposal',
      20,
      60
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.retryAfterSeconds,
        'Proposal generation rate limit reached. Please wait before generating additional proposals.'
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = generateProposalRequestSchema.parse(body);

    let clientName = validated.clientName || 'Valued Client';
    let contactPerson = 'Executive Team';
    let companyDescription = '';
    let painPoints: string[] = [];
    let recommendedServices: string[] = [];
    let recommendedPitch = '';

    // If leadId is provided, pull deep lead intelligence
    if (validated.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: validated.leadId, workspaceId: session.workspaceId },
        include: {
          aiAnalyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (lead) {
        clientName = lead.companyName || `${lead.firstName} ${lead.lastName}`;
        contactPerson = `${lead.firstName} ${lead.lastName}`.trim();
        companyDescription = lead.aiSummary || '';

        const latestAnalysis = lead.aiAnalyses[0];
        if (latestAnalysis) {
          painPoints = (latestAnalysis.likelyPainPoints as string[]) || [];
          recommendedServices = (latestAnalysis.recommendedServices as string[]) || [];
          recommendedPitch = latestAnalysis.recommendedPitch || '';
        }
      }
    }

    // Build AI Prompt
    const prompt = buildProposalGenerationPrompt({
      agencyName: session.agencyName || 'AgencyFlow',
      clientName,
      contactPerson,
      companyDescription,
      painPoints,
      recommendedServices,
      recommendedPitch,
      budget: validated.budget,
      timelineWeeks: validated.timelineWeeks,
      customScope: validated.customScope,
    });

    // Execute structured AI generation
    const aiResult = await aiService.generateStructured<ProposalGeneration>({
      provider: validated.provider,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      schema: ProposalGenerationSchema,
    });

    const proposalData = aiResult.data;

    // Save Proposal to Database in DRAFT status
    const savedProposal = await prisma.proposal.create({
      data: {
        workspaceId: session.workspaceId,
        leadId: validated.leadId || null,
        title: proposalData.title,
        client: proposalData.clientName,
        value: proposalData.totalValue,
        status: 'DRAFT',
        summary: proposalData.summary,
        scopeOfWork: proposalData.scopeOfWork as any,
        deliverables: proposalData.keyDeliverables as any,
        pricingItems: proposalData.pricingItems as any,
        paymentTerms: proposalData.paymentTerms,
        preparedBy: session.fullName,
        metadata: {
          estimatedWeeks: proposalData.estimatedWeeks,
          provider: aiResult.provider,
          model: aiResult.model,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: savedProposal,
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
    console.error('[Generate Proposal API Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
