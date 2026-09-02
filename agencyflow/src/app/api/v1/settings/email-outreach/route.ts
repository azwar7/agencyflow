import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const updateEmailSettingsSchema = z.object({
  emailSenderName: z.string().max(100).nullable().optional(),
  emailReplyTo: z.string().email('Invalid reply-to email').nullable().optional().or(z.literal('')),
  emailSignature: z.string().max(1000).nullable().optional(),
  outreachDailyLimit: z.number().min(1).max(5000).optional(),
  outreachSendingHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
  outreachSendingHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
  outreachSendingDays: z.array(z.number().min(0).max(6)).optional(),
  outreachDelayBetweenEmails: z.number().min(0).max(3600).optional(),
  outreachDefaultSenderAccount: z.enum(['GMAIL_SMTP', 'OUTLOOK_OAUTH', 'N8N_RELAY']).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: {
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
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    // Calculate real today's sent email count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await prisma.outreachEmail.count({
      where: {
        workspaceId: session.workspaceId,
        status: 'SENT',
        sentAt: { gte: startOfDay },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...workspace,
        outreachSendingDays: workspace.outreachSendingDays || [1, 2, 3, 4, 5],
        sentToday,
        remainingToday: Math.max(0, workspace.outreachDailyLimit - sentToday),
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
    const validated = updateEmailSettingsSchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: session.workspaceId },
      data: {
        ...(validated.emailSenderName !== undefined ? { emailSenderName: validated.emailSenderName } : {}),
        ...(validated.emailReplyTo !== undefined ? { emailReplyTo: validated.emailReplyTo || null } : {}),
        ...(validated.emailSignature !== undefined ? { emailSignature: validated.emailSignature } : {}),
        ...(typeof validated.outreachDailyLimit === 'number' ? { outreachDailyLimit: validated.outreachDailyLimit } : {}),
        ...(validated.outreachSendingHoursStart ? { outreachSendingHoursStart: validated.outreachSendingHoursStart } : {}),
        ...(validated.outreachSendingHoursEnd ? { outreachSendingHoursEnd: validated.outreachSendingHoursEnd } : {}),
        ...(validated.outreachSendingDays ? { outreachSendingDays: validated.outreachSendingDays } : {}),
        ...(typeof validated.outreachDelayBetweenEmails === 'number' ? { outreachDelayBetweenEmails: validated.outreachDelayBetweenEmails } : {}),
        ...(validated.outreachDefaultSenderAccount ? { outreachDefaultSenderAccount: validated.outreachDefaultSenderAccount } : {}),
      },
      select: {
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
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'EMAIL_SETTINGS_UPDATE',
      entityType: 'Workspace',
      entityId: session.workspaceId,
      metadata: validated,
    });

    return NextResponse.json({
      success: true,
      message: 'Email preferences and outreach sending rules saved successfully.',
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
      { success: false, error: { message: error.message || 'Failed to update email settings' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
