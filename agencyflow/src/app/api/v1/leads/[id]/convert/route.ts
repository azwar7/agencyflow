import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession(request);
    const { id } = await params;
    const body = await request.json();
    const dealTitle = body.dealTitle || 'New Agency Service Deal';
    const dealValue = parseFloat(body.dealValue || '25000');

    // Strict workspace-scoped lookup
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const userId = session.userId;
    const workspaceId = session.workspaceId;

    // Atomic Transaction scoped strictly to authenticated tenant
    const result = await prisma.$transaction(async (tx) => {
      // 1. Company
      let company = null;
      if (lead.companyName) {
        company = await tx.company.create({
          data: {
            workspaceId,
            name: lead.companyName,
          },
        });
      }

      // 2. Contact
      const contact = await tx.contact.create({
        data: {
          workspaceId,
          companyId: company ? company.id : null,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
        },
      });

      // 3. Deal
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

      // 4. Update Lead Status
      await tx.lead.update({
        where: { id },
        data: { status: 'CONVERTED' },
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
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Conversion failed' } },
      { status }
    );
  }
}
