import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const approveEmailSchema = z.object({
  outreachId: z.string().min(1, 'outreachId is required'),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  tone: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    const { id: leadId } = await params;

    const reqBody = await request.json().catch(() => ({}));
    const validated = approveEmailSchema.parse(reqBody);

    // Verify lead and outreach exist strictly within authenticated workspace
    const outreach = await prisma.outreachEmail.findFirst({
      where: {
        id: validated.outreachId,
        leadId,
        workspaceId: session.workspaceId,
      },
    });

    if (!outreach) {
      return NextResponse.json(
        { success: false, error: { message: 'Outreach email not found in current workspace.' } },
        { status: 404 }
      );
    }

    // Update with any manual edits and mark as APPROVED
    const updated = await prisma.outreachEmail.update({
      where: { id: validated.outreachId },
      data: {
        ...(validated.subject ? { subject: validated.subject } : {}),
        ...(validated.body ? { body: validated.body } : {}),
        ...(validated.tone ? { tone: validated.tone } : {}),
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Outreach email approved successfully.',
      data: updated,
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

    console.error('[Approve Outreach API Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
