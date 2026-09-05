import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { isEmailAvailable } from '@/lib/lead-utils';

const convertSchema = z.object({
  dealTitle: z.string().min(1, 'Deal title is required').max(255).optional().default('New Agency Service Deal'),
  dealValue: z.coerce.number().min(0, 'Deal value cannot be negative').max(100_000_000, 'Deal value exceeds limit').optional().default(0),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validated = convertSchema.parse(body);

    const dealTitle = validated.dealTitle;
    const dealValue = validated.dealValue;

    // Strict workspace-scoped lookup
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: { message: 'Lead not found' } }, { status: 404 });
    }

    // Fast-fail check if lead is already converted
    if (lead.status === 'CONVERTED') {
      return NextResponse.json(
        { success: false, error: { message: 'Lead has already been converted.' } },
        { status: 400 }
      );
    }

    const userId = session.userId;
    const workspaceId = session.workspaceId;

    // Atomic Transaction with conditional update to guarantee zero duplicate conversion under concurrency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atomic compare-and-swap status transition
      const transitionResult = await tx.lead.updateMany({
        where: {
          id,
          workspaceId,
          status: { not: 'CONVERTED' },
        },
        data: { status: 'CONVERTED' },
      });

      if (transitionResult.count === 0) {
        throw new Error('Lead has already been converted.');
      }

      // 2. Company (reuse existing to prevent duplicate accounts)
      let company = null;
      if (lead.companyName) {
        company = await tx.company.findFirst({
          where: { workspaceId, name: lead.companyName.trim() },
        });
        if (!company) {
          company = await tx.company.create({
            data: {
              workspaceId,
              name: lead.companyName.trim(),
            },
          });
        }
      }

      // 3. Contact (reuse existing to prevent duplicate contacts if email is available)
      const validContactEmail = isEmailAvailable(lead.email) ? lead.email.trim() : '';
      let contact = validContactEmail
        ? await tx.contact.findFirst({
            where: { workspaceId, email: validContactEmail },
          })
        : null;

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            workspaceId,
            companyId: company ? company.id : null,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: validContactEmail,
            phone: lead.phone,
          },
        });
      } else if (company && !contact.companyId) {
        contact = await tx.contact.update({
          where: { id: contact.id },
          data: { companyId: company.id },
        });
      }

      // 4. Deal
      const deal = await tx.deal.create({
        data: {
          workspaceId,
          contactId: contact.id,
          companyId: company ? company.id : null,
          assignedToId: lead.assignedToId || userId,
          title: dealTitle,
          value: dealValue,
          stage: 'DISCOVERY',
          expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      // 5. Activity
      await tx.activity.create({
        data: {
          workspaceId,
          userId,
          dealId: deal.id,
          type: 'STAGE_CHANGE',
          content: `Converted Lead (${lead.firstName} ${lead.lastName}) into Deal: "${dealTitle}" ($${dealValue.toLocaleString()}).`,
        },
      });

      return { contact, deal };
    });

    return NextResponse.json({
      success: true,
      message: 'Lead converted successfully!',
      data: result,
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
    const isClientError =
      error.message?.toLowerCase().includes('converted') ||
      error.message?.toLowerCase().includes('not found') ||
      error.message?.toLowerCase().includes('lead');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : isClientError ? 400 : 400;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Conversion failed' } },
      { status }
    );
  }
}
