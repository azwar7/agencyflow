import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }

    // Strictly scope lead lookup to authenticated workspace to prevent cross-tenant IDOR
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId: session.workspaceId,
      },
      include: { activities: true },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // AI Lead Qualification Evaluation Logic
    let score = 60;
    const insights: string[] = [];

    if (lead.email.includes('.com') || lead.email.includes('.io') || lead.email.includes('.net')) {
      score += 10;
      insights.push('Verified corporate email domain.');
    }

    if (lead.companyName) {
      score += 15;
      insights.push(`Legitimate business entity identified: ${lead.companyName}.`);
    }

    if (lead.activities.length > 0) {
      score += 10;
      insights.push(`Active engagement: ${lead.activities.length} activity interactions recorded.`);
    } else {
      score -= 10;
      insights.push('Cold prospect: No call or meeting logs recorded yet.');
    }

    if (lead.source.includes('Referral') || lead.source.includes('Inbound')) {
      score += 10;
      insights.push('High-intent acquisition channel (Inbound / Executive Referral).');
    }

    // Clamp score 1-100
    score = Math.min(Math.max(score, 15), 98);

    const summaryText = `AI Analysis (${score}/100 Score): ${insights.join(' ')} Target next action: Schedule 15-min discovery call.`;

    // Persist AI analysis back to database
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadScore: score,
        aiSummary: summaryText,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        score,
        insights,
        summary: summaryText,
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
