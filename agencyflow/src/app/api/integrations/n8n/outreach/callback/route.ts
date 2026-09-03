import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyN8nSecret, N8nAuthenticationError } from '@/lib/integrations/n8n/auth';

const callbackSchema = z.object({
  outreachId: z.string().min(1, 'outreachId is required'),
  status: z.enum(['SENT', 'FAILED']),
  failureReason: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validated = callbackSchema.parse(body);

    // Authenticate server-to-server request via secret header
    verifyN8nSecret(request);

    // Verify outreach exists in database
    const outreach = await prisma.outreachEmail.findUnique({
      where: {
        id: validated.outreachId,
      },
      include: { lead: true },
    });

    if (!outreach) {
      return NextResponse.json(
        { success: false, error: { message: 'Outreach record not found.' } },
        { status: 404 }
      );
    }

    // Update outreach status and record delivery timestamps
    const updated = await prisma.outreachEmail.update({
      where: { id: outreach.id },
      data: {
        status: validated.status,
        ...(validated.status === 'SENT' ? { sentAt: new Date() } : {}),
        ...(validated.failureReason ? { failureReason: validated.failureReason } : {}),
      },
    });

    if (validated.status === 'FAILED') {
      const activeUser = await prisma.user.findFirst({
        where: { workspaceId: outreach.workspaceId },
        select: { id: true },
      });
      if (activeUser) {
        await prisma.activity.create({
          data: {
            workspaceId: outreach.workspaceId,
            userId: activeUser.id,
            leadId: outreach.leadId,
            type: 'NOTE',
            content: `⚠️ Outreach Delivery Failed: ${validated.failureReason || 'Email delivery failed at email gateway.'}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Outreach delivery status updated to ${validated.status}.`,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof N8nAuthenticationError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.status }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }

    console.error('[n8n Outreach Callback Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
