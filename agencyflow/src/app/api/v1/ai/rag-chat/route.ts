import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;
    const body = await request.json();
    const query = (body.query || body.message || '').trim();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // 1. Fetch live workspace data (RAG Knowledge Context)
    const [leads, deals, tasks, projects, invoices, deliverables] = await Promise.all([
      prisma.lead.findMany({
        where: { workspaceId },
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, companyName: true, status: true, leadScore: true, email: true },
      }),
      prisma.deal.findMany({
        where: { workspaceId },
        take: 15,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, value: true, stage: true },
      }),
      prisma.task.findMany({
        where: { workspaceId },
        take: 20,
        orderBy: { dueDate: 'asc' },
        include: { assignedTo: { select: { fullName: true } } },
      }),
      prisma.project.findMany({
        where: { workspaceId },
        take: 15,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, clientName: true, status: true, progress: true, budget: true, nextMilestone: true, dueDate: true },
      }),
      prisma.invoice.findMany({
        where: { workspaceId },
        take: 15,
        orderBy: { issuedDate: 'desc' },
        select: { id: true, number: true, client: true, amount: true, status: true, dueDate: true },
      }),
      prisma.deliverable.findMany({
        where: { workspaceId },
        take: 15,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, clientContact: true, status: true, version: true, fileType: true },
      }),
    ]);

    const qLower = query.toLowerCase();

    // 2. Action Execution: Create Task directly in database
    if (qLower.includes('create task') || qLower.includes('add task') || qLower.includes('new task')) {
      const defaultUser = await prisma.user.findFirst({ where: { workspaceId } });
      const createdTask = await prisma.task.create({
        data: {
          workspaceId,
          assignedToId: defaultUser?.id || session.userId,
          title: query.replace(/(create|add|new)\s+task:?/i, '').trim() || 'AI Generated Sprint Task',
          priority: qLower.includes('high') ? 'HIGH' : qLower.includes('low') ? 'LOW' : 'MEDIUM',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({
        success: true,
        answer: `✅ **Task Created Successfully!**\n\nI have added **"${createdTask.title}"** to your Task Board:\n- **Priority**: ${createdTask.priority}\n- **Status**: PENDING\n- **Due Date**: ${createdTask.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        cards: [
          {
            title: createdTask.title,
            type: 'Task',
            badge: createdTask.priority,
            link: '/tasks',
            meta: `Status: PENDING • Due: ${createdTask.dueDate.toLocaleDateString()}`,
          },
        ],
      });
    }

    // 3. Prepare structured RAG context payload for LLM
    const crmContext = {
      workspaceId: session.workspaceId,
      user: session.fullName || 'Agency Lead',
      leadsSummary: {
        total: leads.length,
        items: leads.map((l) => ({
          name: l.companyName || `${l.firstName} ${l.lastName}`,
          email: l.email,
          status: l.status,
          score: l.leadScore,
        })),
      },
      dealsSummary: {
        total: deals.length,
        totalValue: deals.reduce((acc, d) => acc + d.value, 0),
        items: deals.map((d) => ({ title: d.title, value: d.value, stage: d.stage })),
      },
      projectsSummary: {
        total: projects.length,
        items: projects.map((p) => ({
          title: p.title,
          client: p.clientName,
          status: p.status,
          progress: `${p.progress}%`,
          budget: `$${Number(p.budget).toLocaleString()}`,
          nextMilestone: p.nextMilestone,
          dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'TBD',
        })),
      },
      invoicesSummary: {
        total: invoices.length,
        totalInvoiced: invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
        paidTotal: invoices.filter((i) => i.status === 'PAID').reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
        pendingTotal: invoices.filter((i) => i.status === 'PENDING').reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
        overdueTotal: invoices.filter((i) => i.status === 'OVERDUE').reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
        items: invoices.map((i) => ({
          number: i.number || i.id,
          client: i.client,
          amount: `$${Number(i.amount).toLocaleString()}`,
          status: i.status,
          due: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A',
        })),
      },
      tasksSummary: {
        total: tasks.length,
        openTasks: tasks.filter((t) => t.status !== 'COMPLETED').length,
        items: tasks.map((t) => ({
          title: t.title,
          assignee: t.assignedTo?.fullName || 'Unassigned',
          priority: t.priority,
          status: t.status,
          due: new Date(t.dueDate).toLocaleDateString(),
        })),
      },
      deliverablesSummary: {
        total: deliverables.length,
        items: deliverables.map((d) => ({
          title: d.title,
          client: d.clientContact,
          status: d.status,
          version: d.version,
          format: d.fileType,
        })),
      },
    };

    // 4. Try Google Gemini API (Free Tier)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const systemPrompt = `You are AgencyFlow AI, an executive AI assistant and business intelligence engine for digital agencies.
You have real-time access to the user's CRM database via the following live JSON data:
${JSON.stringify(crmContext, null, 2)}

Instructions:
1. Answer the user's question directly using the actual facts, names, figures, and metrics in the CRM data above.
2. Be concise, sharp, professional, and actionable.
3. Use markdown formatting (bullet points, bold highlights).
4. If the user asks about money/invoices, calculate the exact totals from the invoices list.
5. If the user asks about clients (e.g. Mohmand, Apex, Elevate, Vanguard), cross-reference their leads, projects, and invoices.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: `User Question: "${query}"` },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
              },
            }),
          }
        );

        const geminiData = await geminiRes.json();
        const geminiAnswer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (geminiAnswer) {
          // Identify relevant cards to attach
          const relevantCards: any[] = [];
          if (qLower.includes('invoice') || qLower.includes('cash') || qLower.includes('money') || qLower.includes('paid')) {
            invoices.slice(0, 3).forEach((inv) => {
              relevantCards.push({
                title: `${inv.client} — $${Number(inv.amount).toLocaleString()}`,
                type: 'Invoice',
                badge: inv.status,
                link: '/invoices',
                meta: `ID: ${inv.number || inv.id}`,
              });
            });
          } else if (qLower.includes('project') || qLower.includes('milestone')) {
            projects.slice(0, 3).forEach((p) => {
              relevantCards.push({
                title: p.title,
                type: 'Project',
                badge: p.status,
                link: '/projects',
                meta: `${p.clientName} • ${p.progress}% Complete`,
              });
            });
          } else if (qLower.includes('lead') || qLower.includes('prospect')) {
            leads.slice(0, 3).forEach((l) => {
              relevantCards.push({
                title: l.companyName || `${l.firstName} ${l.lastName}`,
                type: 'Lead',
                badge: `Score ${l.leadScore}`,
                link: '/leads',
                meta: `Stage: ${l.status}`,
              });
            });
          } else {
            relevantCards.push(
              { title: 'Pipeline Leads', type: 'Leads', badge: `${leads.length} Records`, link: '/leads', meta: 'AI Scored' },
              { title: 'Project Delivery', type: 'Projects', badge: `${projects.length} Active`, link: '/projects', meta: 'Milestones & Timelines' },
              { title: 'Billing & Invoices', type: 'Invoices', badge: `$${crmContext.invoicesSummary.totalInvoiced.toLocaleString()}`, link: '/invoices', meta: 'Cashflow' }
            );
          }

          return NextResponse.json({
            success: true,
            answer: geminiAnswer,
            cards: relevantCards,
          });
        }
      } catch (geminiErr) {
        console.error('Gemini RAG fallback:', geminiErr);
      }
    }

    // 5. Fallback deterministic RAG response generator
    let fallbackAnswer = `### 🧠 AgencyFlow CRM Intelligence Summary:\n\nBased on your live workspace database:\n\n`;
    if (qLower.includes('invoice') || qLower.includes('cash')) {
      fallbackAnswer += `- **Total Invoiced**: $${crmContext.invoicesSummary.totalInvoiced.toLocaleString()}\n- **Collected Cash**: $${crmContext.invoicesSummary.paidTotal.toLocaleString()}\n- **Pending Inflow**: $${crmContext.invoicesSummary.pendingTotal.toLocaleString()}\n- **Overdue Invoices Alert**: $${crmContext.invoicesSummary.overdueTotal.toLocaleString()}`;
    } else if (qLower.includes('project')) {
      fallbackAnswer += `You currently have **${projects.length} active projects** with a total value of **$${projects.reduce((a, b) => a + Number(b.budget), 0).toLocaleString()}**.`;
    } else {
      fallbackAnswer += `You have **${leads.length} leads**, **${projects.length} active projects**, **${tasks.length} tasks**, and **$${crmContext.invoicesSummary.totalInvoiced.toLocaleString()}** in total invoiced volume.`;
    }

    return NextResponse.json({
      success: true,
      answer: fallbackAnswer,
      cards: [
        { title: 'Pipeline Leads', type: 'Leads', badge: `${leads.length} Records`, link: '/leads', meta: 'CRM Database' },
        { title: 'Active Projects', type: 'Projects', badge: `${projects.length} Active`, link: '/projects', meta: 'Delivery Roadmaps' },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
