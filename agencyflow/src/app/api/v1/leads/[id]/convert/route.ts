import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const dealTitle = body.dealTitle || 'New Agency Service Deal';
    const dealValue = parseFloat(body.dealValue || '25000');

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ success: false, error: 'No user context' }, { status: 400 });

    // Transactional conversion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Company
      let company = null;
      if (lead.companyName) {
        company = await tx.company.create({
          data: {
            workspaceId: lead.workspaceId,
            name: lead.companyName,
          },
        });
      }

      // 2. Contact
      const contact = await tx.contact.create({
        data: {
          workspaceId: lead.workspaceId,
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
          workspaceId: lead.workspaceId,
          contactId: contact.id,
          companyId: company ? company.id : null,
          assignedToId: lead.assignedToId || user.id,
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
          workspaceId: lead.workspaceId,
          userId: user.id,
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
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Conversion failed' } },
      { status: 500 }
    );
  }
}
