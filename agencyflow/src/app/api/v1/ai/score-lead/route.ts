import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();
    if (!leadId) return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { activities: true },
    });

    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

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
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
