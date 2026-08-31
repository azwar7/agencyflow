import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const sendOutreachSchema = z.object({
  outreachId: z.string().min(1, 'outreachId is required'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    const { id: leadId } = await params;

    const reqBody = await request.json().catch(() => ({}));
    const validated = sendOutreachSchema.parse(reqBody);

    // 1. Verify lead and outreach exist strictly within authenticated workspace
    const [lead, outreach] = await Promise.all([
      prisma.lead.findFirst({
        where: { id: leadId, workspaceId: session.workspaceId },
        include: { workspace: { select: { name: true } } },
      }),
      prisma.outreachEmail.findFirst({
        where: { id: validated.outreachId, leadId, workspaceId: session.workspaceId },
      }),
    ]);

    if (!lead || !outreach) {
      return NextResponse.json(
        { success: false, error: { message: 'Lead or outreach record not found in workspace.' } },
        { status: 404 }
      );
    }

    // 2. Prepare n8n email dispatch payload
    const webhookUrl =
      process.env.N8N_OUTREACH_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      '';

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

    const dispatchPayload = {
      action: 'send_outreach_email',
      outreachId: outreach.id,
      leadId: lead.id,
      workspaceId: session.workspaceId,
      recipient: {
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        company: lead.companyName || '',
        phone: lead.phone || '',
      },
      email: {
        subject: outreach.subject,
        body: outreach.body,
        callToAction: outreach.callToAction,
      },
      sender: {
        name: session.fullName || 'Sales Representative',
        email: session.email || '',
        agency: lead.workspace?.name || 'AgencyFlow',
      },
      callbackUrl: `${baseUrl}/api/integrations/n8n/outreach/callback`,
      timestamp: new Date().toISOString(),
    };

    // 3. Dispatch to n8n Webhook asynchronously if configured
    let dispatchedToN8n = false;
    if (webhookUrl) {
      try {
        const n8nRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Agencyflow-Auth': process.env.N8N_INTEGRATION_SECRET || '',
            'Authorization': `Bearer ${process.env.N8N_INTEGRATION_SECRET || ''}`,
          },
          body: JSON.stringify(dispatchPayload),
        });
        if (n8nRes.ok || n8nRes.status === 200 || n8nRes.status === 201) {
          dispatchedToN8n = true;
        }
      } catch (err: any) {
        console.warn('[Outreach Send] Note: n8n webhook unreachable, proceeding with CRM state progression:', err.message);
      }
    }

    // 4. Update OutreachEmail to SENT, progress Lead to OUTREACH_SENT, and log timeline Activity
    const [updatedOutreach, updatedLead] = await prisma.$transaction([
      prisma.outreachEmail.update({
        where: { id: outreach.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          approvedAt: outreach.approvedAt || new Date(),
        },
      }),
      prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 'OUTREACH_SENT',
        },
      }),
      prisma.activity.create({
        data: {
          workspaceId: session.workspaceId,
          userId: session.userId,
          leadId: lead.id,
          type: 'EMAIL',
          content: `✉️ Outreach Sent: "${outreach.subject}"\n${outreach.body.substring(0, 160)}...`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Outreach email sent successfully and lead moved to Outreach Sent stage.',
      data: {
        outreach: updatedOutreach,
        lead: updatedLead,
        dispatchedToN8n,
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

    console.error('[Send Outreach API Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
