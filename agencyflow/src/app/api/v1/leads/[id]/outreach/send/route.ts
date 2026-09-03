import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const sendOutreachSchema = z.object({
  outreachId: z.string().min(1, 'outreachId is required'),
  forceSend: z.boolean().optional().default(true),
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

    // 1. Verify lead, outreach, and workspace settings
    const [lead, outreach, workspace] = await Promise.all([
      prisma.lead.findFirst({
        where: { id: leadId, workspaceId: session.workspaceId },
        include: { workspace: { select: { name: true } } },
      }),
      prisma.outreachEmail.findFirst({
        where: { id: validated.outreachId, leadId, workspaceId: session.workspaceId },
      }),
      prisma.workspace.findUnique({
        where: { id: session.workspaceId },
        select: {
          name: true,
          emailSenderName: true,
          emailReplyTo: true,
          emailSignature: true,
          outreachDailyLimit: true,
          outreachSendingHoursStart: true,
          outreachSendingHoursEnd: true,
          outreachSendingDays: true,
          outreachDelayBetweenEmails: true,
          outreachDefaultSenderAccount: true,
        },
      }),
    ]);

    if (!lead || !outreach) {
      return NextResponse.json(
        { success: false, error: { message: 'Lead or outreach record not found in workspace.' } },
        { status: 404 }
      );
    }

    // Guard: Prevent sending the same email multiple times
    if (outreach.status === 'SENT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `This outreach email has already been sent to ${lead.email} on ${
              outreach.sentAt ? new Date(outreach.sentAt).toLocaleString() : 'previously'
            }. Please draft a new follow-up to send another message.`,
          },
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // 2. VALIDATE OUTREACH CONSTRAINTS & SENDING LIMITS
    // -------------------------------------------------------------

    // A. Daily Sending Limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await prisma.outreachEmail.count({
      where: {
        workspaceId: session.workspaceId,
        status: 'SENT',
        sentAt: { gte: startOfDay },
      },
    });

    const dailyLimit = workspace?.outreachDailyLimit ?? 50;
    if (sentToday >= dailyLimit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Workspace daily outreach sending limit of ${dailyLimit} emails has been reached. Please adjust in Settings or try tomorrow.`,
          },
        },
        { status: 429 }
      );
    }

    // B. Delay Between Dispatches (Spam Prevention)
    const delaySeconds = workspace?.outreachDelayBetweenEmails ?? 10;
    if (delaySeconds > 0 && !validated.forceSend) {
      const lastSent = await prisma.outreachEmail.findFirst({
        where: {
          workspaceId: session.workspaceId,
          status: 'SENT',
        },
        orderBy: { sentAt: 'desc' },
      });

      if (lastSent?.sentAt) {
        const elapsedSec = (Date.now() - lastSent.sentAt.getTime()) / 1000;
        if (elapsedSec < delaySeconds) {
          const remainingSec = Math.ceil(delaySeconds - elapsedSec);
          return NextResponse.json(
            {
              success: false,
              error: {
                message: `Outreach rate limit: please wait ${remainingSec}s before dispatching another email.`,
              },
            },
            { status: 429 }
          );
        }
      }
    }

    // -------------------------------------------------------------
    // 3. PREPARE EMAIL CONTENT & DISPATCH
    // -------------------------------------------------------------
    const senderDisplayName = workspace?.emailSenderName || session.fullName || 'Sales Representative';
    const replyToEmail = workspace?.emailReplyTo || session.email || 'no-reply@agencyflow.io';
    const emailBodyWithSig = workspace?.emailSignature
      ? `${outreach.body}\n\n${workspace.emailSignature}`
      : outreach.body;

    const webhookUrl =
      process.env.N8N_WEBHOOK_OUTREACH_URL ||
      process.env.N8N_OUTREACH_WEBHOOK_URL ||
      'https://suri69.app.n8n.cloud/webhook/send-outreach';

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
        body: emailBodyWithSig,
        callToAction: outreach.callToAction,
        replyTo: replyToEmail,
      },
      sender: {
        name: senderDisplayName,
        email: session.email || '',
        agency: lead.workspace?.name || 'AgencyFlow',
      },
      callbackUrl: `${baseUrl}/api/integrations/n8n/outreach/callback`,
      timestamp: new Date().toISOString(),
    };

    // 3. Dispatch to n8n Webhook and strictly verify delivery
    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No n8n Outreach Webhook URL configured. Please set N8N_OUTREACH_WEBHOOK_URL or N8N_WEBHOOK_URL in environment.',
          },
        },
        { status: 400 }
      );
    }

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

      if (!n8nRes.ok && n8nRes.status !== 200 && n8nRes.status !== 201) {
        const errorText = await n8nRes.text().catch(() => '');
        const failureReason =
          n8nRes.status === 404
            ? 'n8n outreach workflow is not active or published. Please make sure the workflow is published and active in n8n.'
            : `n8n workflow rejected the request (HTTP ${n8nRes.status}): ${errorText || 'Check n8n execution log.'}`;

        await prisma.outreachEmail.update({
          where: { id: outreach.id },
          data: {
            status: 'FAILED',
            failureReason,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: { message: failureReason },
          },
          { status: 502 }
        );
      }
    } catch (err: any) {
      const failureReason = `Could not connect to n8n outreach webhook: ${err.message}. Please verify n8n is running and reachable.`;
      await prisma.outreachEmail.update({
        where: { id: outreach.id },
        data: {
          status: 'FAILED',
          failureReason,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: { message: failureReason },
        },
        { status: 502 }
      );
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
          content: `Outreach email approved & dispatched to ${lead.email}: "${outreach.subject}"`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Outreach email dispatched to ${lead.email}. Lead progressed to Outreach Sent.`,
      data: {
        outreach: updatedOutreach,
        lead: updatedLead,
        deliveryChannel: 'n8n_webhook',
        sentToday: sentToday + 1,
        dailyLimit,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to dispatch email' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
