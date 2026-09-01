import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const acceptProposalSchema = z.object({
  signerName: z.string().min(1, 'Signer name is required'),
  signerTitle: z.string().min(1, 'Signer title is required'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    const { id: proposalId } = await params;
    const body = await request.json().catch(() => ({}));
    const validated = acceptProposalSchema.parse(body);

    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, workspaceId: session.workspaceId },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: { message: 'Proposal not found in current workspace.' } },
        { status: 404 }
      );
    }

    const depositAmount = Math.round(proposal.value * 0.5);
    const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

    // Execute transactional project creation, deposit invoice, and status updates
    const [updatedProposal, createdProject, createdInvoice] = await prisma.$transaction([
      // 1. Update proposal status to ACCEPTED
      prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          status: 'ACCEPTED',
          acceptedBy: validated.signerName,
          acceptedTitle: validated.signerTitle,
        },
      }),

      // 2. Automatically spawn an active Project in the Projects board
      prisma.project.create({
        data: {
          workspaceId: session.workspaceId,
          companyId: proposal.companyId,
          title: proposal.title,
          clientName: proposal.client,
          status: 'ON TRACK',
          statusType: 'success',
          progress: 10,
          budget: proposal.value,
          nextMilestone: 'Phase 1: Architecture & UI/UX Design Kickoff',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        },
      }),

      // 3. Automatically draft the 50% Deposit Invoice in Invoices
      prisma.invoice.create({
        data: {
          workspaceId: session.workspaceId,
          companyId: proposal.companyId,
          number: invoiceNumber,
          client: proposal.client,
          amount: depositAmount,
          status: 'PENDING',
          dueDate,
        },
      }),

      // 4. If linked to a Lead, advance status to CONVERTED
      ...(proposal.leadId
        ? [
            prisma.lead.update({
              where: { id: proposal.leadId },
              data: { status: 'CONVERTED' },
            }),
          ]
        : []),

      // 5. Timeline Activity Log
      prisma.activity.create({
        data: {
          workspaceId: session.workspaceId,
          userId: session.userId,
          leadId: proposal.leadId,
          type: 'STAGE_CHANGE',
          content: `🎉 Proposal "${proposal.title}" accepted & signed by ${validated.signerName} (${validated.signerTitle}). Spawned Project and created 50% deposit invoice ${invoiceNumber} ($${depositAmount.toLocaleString()}).`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Proposal accepted successfully! Active project created and deposit invoice drafted.',
      data: {
        proposal: updatedProposal,
        project: createdProject,
        invoice: createdInvoice,
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
    console.error('[Accept Proposal API Error]:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
