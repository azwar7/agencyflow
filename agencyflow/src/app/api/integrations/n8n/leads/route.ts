import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';
import { N8nLeadPayloadSchema } from '@/lib/integrations/n8n/schema';
import { authenticateN8nRequest, N8nAuthenticationError } from '@/lib/integrations/n8n/auth';
import { processN8nLead } from '@/lib/integrations/n8n/service';
import { recordLeadIngested } from '@/lib/integrations/n8n/job-tracker';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: protect against denial of service (120 reqs / min / IP)
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit('n8n-integration', clientIp, 120, 60);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.retryAfterSeconds,
        'Too many integration requests. Please respect the rate limit.'
      );
    }

    // 2. Parse request JSON body safely
    let rawBody: any;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid JSON payload received.',
          },
        },
        { status: 400 }
      );
    }

    // 3. Validate incoming payload with Zod Schema
    const validatedPayload = N8nLeadPayloadSchema.parse(rawBody);

    // 4. Authenticate and resolve target workspace
    const authContext = await authenticateN8nRequest(request, validatedPayload);

    // 5. Process lead with ordered duplicate detection and persistence
    const result = await processN8nLead(validatedPayload, authContext);

    // Track lead discovery against any active background Lead Finder job
    if (!result.isDuplicate && result.leadId) {
      await recordLeadIngested(authContext.workspaceId, result.leadId).catch((err) =>
        console.warn('[n8n Lead Ingestion] Failed to record lead in job tracker:', err)
      );
    }

    // 6. Return appropriate structured response
    if (result.isDuplicate) {
      return NextResponse.json(
        {
          success: true,
          created: false,
          duplicate: true,
          leadId: result.leadId,
          message: result.duplicateReason || 'Lead already exists in workspace.',
          workspace: {
            id: authContext.workspaceId,
            name: authContext.workspaceName,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        created: true,
        duplicate: false,
        leadId: result.leadId,
        message: 'Lead successfully ingested into CRM.',
        data: result.data,
        workspace: {
          id: authContext.workspaceId,
          name: authContext.workspaceName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof N8nAuthenticationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: error.status }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed for incoming n8n lead payload.',
            issues: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    console.error('[n8n Integration API] Unexpected error during ingestion:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected internal error occurred while processing the lead.',
        },
      },
      { status: 500 }
    );
  }
}
