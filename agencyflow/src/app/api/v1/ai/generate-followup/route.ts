import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { leadId, tone } = await request.json();

    let recipientName = 'Prospect';
    let companyName = 'your organization';
    let score = 75;

    if (leadId) {
      // Scope lookup strictly to authenticated workspace to prevent cross-tenant enumeration
      const lead = await prisma.lead.findFirst({
        where: {
          id: leadId,
          workspaceId: session.workspaceId,
        },
      });

      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }

      recipientName = `${lead.firstName} ${lead.lastName}`;
      companyName = lead.companyName || 'your team';
      score = lead.leadScore;
    }

    const isUrgent = tone === 'urgent';
    const isExecutive = tone === 'executive';

    const subject = isUrgent
      ? `Time-sensitive: Next steps for ${companyName}`
      : isExecutive
      ? `Executive Briefing & Strategic Proposal for ${companyName}`
      : `Following up on our discovery discussion for ${companyName}`;

    const body = `Hi ${recipientName},

${
  isExecutive
    ? `I wanted to reach out directly to outline how our custom engineering and growth team can accelerate ${companyName}'s Q3 strategic roadmap.`
    : isUrgent
    ? `I know you have a tight target schedule for ${companyName}. I wanted to check if you have 5 minutes to lock down the scope agreement.`
    : `Thank you for taking the time to share your current workflow objectives for ${companyName}. Based on our review, we have prepared a tailored approach.`
}

Key Highlights:
- Custom multi-tenant workspace architecture aligned with your team's exact workflow
- Sub-200ms real-time activity and pipeline tracking
- AI-assisted lead qualification and automated follow-ups

Would you be open to a brief 10-minute touchpoint this Thursday at 2 PM EST?

Best regards,
AgencyFlow Team`;

    return NextResponse.json({
      success: true,
      data: {
        subject,
        body,
        tone: tone || 'professional',
      },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status }
    );
  }
}
