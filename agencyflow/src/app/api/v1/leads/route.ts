import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { getVisibilityFilter } from '@/lib/visibility';

const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  source: z.string().optional().default('Website Inbound'),
  status: z.string().optional().default('NEW'),
  customFields: z.record(z.any()).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 200);

    const visibilityFilter = await getVisibilityFilter(session, 'lead');

    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        ...visibilityFilter,
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        status: true,
        leadScore: true,
        source: true,
        aiSummary: true,
        createdAt: true,
        assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const userId = session.userId;

    const body = await request.json();
    const validated = createLeadSchema.parse(body);

    // 1. Fetch workspace lead settings for duplicate detection, assignment rules & AI auto-analyze
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        duplicateLeadDetection: true,
        defaultLeadOwnerId: true,
        leadAssignmentRule: true,
        aiAutoAnalyzeLeads: true,
        aiLeadAnalysisEnabled: true,
        aiProvider: true,
      },
    });

    // 2. Duplicate Detection
    const dupRule = workspace?.duplicateLeadDetection || 'EMAIL_AND_PHONE';
    if (dupRule !== 'OFF') {
      const emailDup = await prisma.lead.findFirst({
        where: { workspaceId, email: validated.email.trim().toLowerCase() },
      });
      if (emailDup) {
        return NextResponse.json(
          { success: false, error: { message: `A lead with email '${validated.email}' already exists in your workspace.` } },
          { status: 400 }
        );
      }

      if (dupRule === 'EMAIL_AND_PHONE' && validated.phone) {
        const phoneDup = await prisma.lead.findFirst({
          where: { workspaceId, phone: validated.phone.trim() },
        });
        if (phoneDup) {
          return NextResponse.json(
            { success: false, error: { message: `A lead with phone number '${validated.phone}' already exists.` } },
            { status: 400 }
          );
        }
      }
    }

    // 3. Assignment Rule
    let assignedUserId = userId;
    if (workspace?.leadAssignmentRule === 'DEFAULT_OWNER' && workspace.defaultLeadOwnerId) {
      assignedUserId = workspace.defaultLeadOwnerId;
    }

    const newLead = await prisma.lead.create({
      data: {
        workspaceId,
        assignedToId: assignedUserId,
        firstName: validated.firstName.trim(),
        lastName: validated.lastName.trim(),
        email: validated.email.trim().toLowerCase(),
        phone: validated.phone?.trim() || null,
        companyName: validated.companyName?.trim() || null,
        source: validated.source || 'Website Inbound',
        status: validated.status || 'NEW',
        leadScore: 60,
        aiSummary: 'New inbound prospect ingested into CRM.',
      },
      include: { assignedTo: { select: { fullName: true } } },
    });

    // 4. Save Custom Field values if provided
    if (validated.customFields && typeof validated.customFields === 'object') {
      const fields = await prisma.customField.findMany({
        where: { workspaceId, entityType: 'LEAD' },
      });
      const fieldMap = new Map(fields.map((f) => [f.key, f]));

      for (const [k, val] of Object.entries(validated.customFields)) {
        const field = fieldMap.get(k);
        if (!field) continue;

        let textValue: string | null = null;
        let numberValue: number | null = null;
        let dateValue: Date | null = null;
        let booleanValue: boolean | null = null;
        let jsonValue: any = null;

        if (field.fieldType === 'NUMBER' || field.fieldType === 'CURRENCY') {
          numberValue = val !== null && val !== undefined && val !== '' ? Number(val) : null;
        } else if (field.fieldType === 'DATE') {
          dateValue = val ? new Date(val as any) : null;
        } else if (field.fieldType === 'CHECKBOX') {
          booleanValue = Boolean(val);
        } else if (field.fieldType === 'MULTI_SELECT') {
          jsonValue = Array.isArray(val) ? val : [];
        } else {
          textValue = val !== null && val !== undefined ? String(val) : null;
        }

        await prisma.customFieldValue.create({
          data: {
            workspaceId,
            customFieldId: field.id,
            recordId: newLead.id,
            textValue,
            numberValue,
            dateValue,
            booleanValue,
            jsonValue,
          },
        });
      }
    }

    // Auto-create company if companyName provided
    if (validated.companyName) {
      const existingCompany = await prisma.company.findFirst({
        where: { workspaceId, name: validated.companyName.trim() },
      });
      if (!existingCompany) {
        await prisma.company.create({
          data: {
            workspaceId,
            name: validated.companyName.trim(),
          },
        });
      }
    }

    // Log Activity
    await prisma.activity.create({
      data: {
        workspaceId,
        userId,
        leadId: newLead.id,
        type: 'NOTE',
        content: `Lead created from source: ${validated.source}`,
      },
    });

    // 5. Auto-analyze new lead if enabled in workspace AI settings
    let finalLeadRecord = newLead;
    if (workspace?.aiAutoAnalyzeLeads && workspace.aiLeadAnalysisEnabled) {
      try {
        const { buildLeadContext } = await import('@/lib/ai/context/lead-context');
        const { buildLeadIntelligencePrompt } = await import('@/lib/ai/prompts/lead-intelligence.prompt');
        const { aiService } = await import('@/lib/ai/ai-service');
        const { LeadIntelligenceSchema } = await import('@/lib/ai/schemas/lead-intelligence.schema');

        const leadContext = await buildLeadContext(newLead.id, session);
        const prompt = buildLeadIntelligencePrompt(leadContext);
        const provider =
          workspace.aiProvider && workspace.aiProvider !== 'system'
            ? (workspace.aiProvider as any)
            : undefined;

        const aiResult = await aiService.generateStructured({
          provider,
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          schema: LeadIntelligenceSchema,
        });

        const intel = aiResult.data;
        await prisma.leadAiAnalysis.create({
          data: {
            workspaceId,
            leadId: newLead.id,
            score: intel.score,
            qualification: intel.qualification,
            companySummary: intel.companySummary,
            likelyPainPoints: intel.likelyPainPoints,
            recommendedServices: intel.recommendedServices,
            recommendedPitch: intel.recommendedPitch,
            reasoning: intel.reasoning,
            confidence: intel.confidence,
            provider: aiResult.provider,
            model: aiResult.model,
          },
        });

        finalLeadRecord = await prisma.lead.update({
          where: { id: newLead.id },
          data: {
            leadScore: intel.score,
            aiSummary: intel.companySummary,
            status: intel.score >= 70 ? 'QUALIFIED' : newLead.status,
          },
          include: { assignedTo: { select: { fullName: true } } },
        });
      } catch (aiErr: any) {
        console.warn('[Lead Ingestion] Auto-analyze skipped/failed:', aiErr.message);
      }
    }

    return NextResponse.json({ success: true, data: finalLeadRecord }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create lead' } },
      { status: 400 }
    );
  }
}
