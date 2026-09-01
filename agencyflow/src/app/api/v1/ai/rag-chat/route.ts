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

    // 1. Fetch live workspace data (RAG Context)
    const [leads, deals, tasks, projects, invoices, deliverables] = await Promise.all([
      prisma.lead.findMany({
        where: { workspaceId },
        take: 15,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, companyName: true, status: true, leadScore: true, email: true },
      }),
      prisma.deal.findMany({
        where: { workspaceId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, value: true, stage: true },
      }),
      prisma.task.findMany({
        where: { workspaceId },
        take: 15,
        orderBy: { dueDate: 'asc' },
        include: { assignedTo: { select: { fullName: true } } },
      }),
      prisma.project.findMany({
        where: { workspaceId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, clientName: true, status: true, progress: true, budget: true, nextMilestone: true, dueDate: true },
      }),
      prisma.invoice.findMany({
        where: { workspaceId },
        take: 10,
        orderBy: { issuedDate: 'desc' },
        select: { id: true, number: true, client: true, amount: true, status: true, dueDate: true },
      }),
      prisma.deliverable.findMany({
        where: { workspaceId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, clientContact: true, status: true, version: true, fileType: true },
      }),
    ]);

    const qLower = query.toLowerCase();

    // 2. Check for Agent Action: Create Task
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
        answer: `I have created the task **"${createdTask.title}"** on your Task Board with priority **${createdTask.priority}** and due date **${createdTask.dueDate.toLocaleDateString()}**.`,
        actionTaken: {
          type: 'TASK_CREATED',
          task: createdTask,
        },
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

    // 3. RAG Query: Cashflow & Invoices
    if (qLower.includes('invoice') || qLower.includes('cash') || qLower.includes('money') || qLower.includes('revenue') || qLower.includes('paid') || qLower.includes('unpaid') || qLower.includes('overdue')) {
      const totalInvoiced = invoices.reduce((a, b) => a + (Number(b.amount) || 0), 0);
      const paid = invoices.filter((i) => i.status === 'PAID');
      const paidTotal = paid.reduce((a, b) => a + (Number(b.amount) || 0), 0);
      const pending = invoices.filter((i) => i.status === 'PENDING');
      const pendingTotal = pending.reduce((a, b) => a + (Number(b.amount) || 0), 0);
      const overdue = invoices.filter((i) => i.status === 'OVERDUE');
      const overdueTotal = overdue.reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const overdueNames = overdue.map((o) => `${o.client} ($${o.amount.toLocaleString()} - ${o.number || o.id})`).join(', ');

      let answer = `### 💰 Cashflow & Billing Summary:\n\n- **Total Invoiced**: $${totalInvoiced.toLocaleString()}\n- **Collected Cash (PAID)**: $${paidTotal.toLocaleString()} (${totalInvoiced > 0 ? Math.round((paidTotal / totalInvoiced) * 100) : 0}% collection rate)\n- **Pending Inflow**: $${pendingTotal.toLocaleString()} across ${pending.length} invoice(s)\n- **Overdue Invoices Alert**: $${overdueTotal.toLocaleString()} across ${overdue.length} invoice(s)\n\n`;

      if (overdue.length > 0) {
        answer += `⚠️ **Overdue Attention Required**: ${overdueNames}. You can click "Send Reminder" in the Invoices hub to trigger an automated payment email via n8n.`;
      } else {
        answer += `🟢 All outstanding invoices are currently within their due dates.`;
      }

      return NextResponse.json({
        success: true,
        answer,
        cards: invoices.map((inv) => ({
          title: `${inv.client} — $${Number(inv.amount).toLocaleString()}`,
          type: 'Invoice',
          badge: inv.status,
          link: '/invoices',
          meta: `ID: ${inv.number || inv.id} • Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}`,
        })),
      });
    }

    // 4. RAG Query: Projects & Delivery Milestones
    if (qLower.includes('project') || qLower.includes('milestone') || qLower.includes('delivery') || qLower.includes('sow') || qLower.includes('progress')) {
      const onTrack = projects.filter((p) => p.status === 'ON TRACK');
      const atRisk = projects.filter((p) => p.status === 'AT RISK');

      let answer = `### 🚀 Active Project Command Center RAG Analysis:\n\nYou currently have **${projects.length} active client project(s)** in your delivery pipeline:\n\n`;

      projects.forEach((p) => {
        const statusIcon = p.status === 'ON TRACK' ? '🟢' : p.status === 'AT RISK' ? '🟠' : '🔵';
        answer += `- ${statusIcon} **${p.title}** (${p.clientName}): **${p.progress}% Complete**\n  - **Status**: ${p.status}\n  - **Contract Budget**: $${Number(p.budget).toLocaleString()}\n  - **Next Milestone**: ${p.nextMilestone}\n\n`;
      });

      if (atRisk.length > 0) {
        answer += `⚠️ **Risk Diagnostic**: Project "${atRisk[0].title}" is flagged as AT RISK. Recommend assigning an additional engineer to unblock ${atRisk[0].nextMilestone}.`;
      }

      return NextResponse.json({
        success: true,
        answer,
        cards: projects.map((p) => ({
          title: p.title,
          type: 'Project',
          badge: p.status,
          link: '/projects',
          meta: `${p.clientName} • ${p.progress}% Complete • Budget: $${Number(p.budget).toLocaleString()}`,
        })),
      });
    }

    // 5. RAG Query: Tasks & Sprint Blockers
    if (qLower.includes('task') || qLower.includes('sprint') || qLower.includes('todo') || qLower.includes('blocker')) {
      const completed = tasks.filter((t) => t.status === 'COMPLETED');
      const inProg = tasks.filter((t) => t.status === 'IN_PROGRESS');
      const pending = tasks.filter((t) => t.status === 'PENDING');
      const onHold = tasks.filter((t) => t.status === 'ON_HOLD');
      const highPri = tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED');

      let answer = `### 📋 Sprint & Task Matrix RAG Diagnostic:\n\n- **Total Sprint Tasks**: ${tasks.length}\n- **Completed**: ${completed.length} (${tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}% sprint velocity)\n- **In Progress**: ${inProg.length}\n- **Pending**: ${pending.length}\n- **On Hold / In Review**: ${onHold.length}\n\n`;

      if (highPri.length > 0) {
        answer += `🔥 **High Priority Open Tasks**:\n`;
        highPri.forEach((t) => {
          answer += `- ⚡ **${t.title}** (Assigned to: ${t.assignedTo?.fullName || 'Alex Rivera'}, Due: ${new Date(t.dueDate).toLocaleDateString()})\n`;
        });
      }

      return NextResponse.json({
        success: true,
        answer,
        cards: highPri.map((t) => ({
          title: t.title,
          type: 'Task',
          badge: t.priority,
          link: '/tasks',
          meta: `Assigned: ${t.assignedTo?.fullName || 'Alex'} • Due: ${new Date(t.dueDate).toLocaleDateString()}`,
        })),
      });
    }

    // 6. RAG Query: Leads & Pipeline Strategy
    if (qLower.includes('lead') || qLower.includes('pipeline') || qLower.includes('icp') || qLower.includes('prospect') || qLower.includes('outreach')) {
      const highIcp = leads.filter((l) => (l.leadScore || 0) >= 80);
      const newLeads = leads.filter((l) => l.status === 'NEW');

      let answer = `### 🎯 Lead & Sales Pipeline Intelligence:\n\n- **Total CRM Leads**: ${leads.length}\n- **High-Fit Prospects (Lead Score ≥ 80)**: ${highIcp.length} leads\n- **Uncontacted (Stage: NEW)**: ${newLeads.length} leads\n\n`;

      if (highIcp.length > 0) {
        answer += `🔥 **Top High-Converting Prospects to Target Today**:\n`;
        highIcp.slice(0, 3).forEach((l) => {
          answer += `- 🌟 **${l.companyName || `${l.firstName} ${l.lastName}`}** (Fit Score: **${l.leadScore}/100**, Stage: ${l.status}, Email: ${l.email || 'N/A'})\n`;
        });
        answer += `\n💡 *Recommendation*: Click into the Leads hub to generate cold outreach icebreakers via our AI generator.`;
      }

      return NextResponse.json({
        success: true,
        answer,
        cards: highIcp.slice(0, 4).map((l) => ({
          title: l.companyName || `${l.firstName} ${l.lastName}`,
          type: 'Lead',
          badge: `Score ${l.leadScore || 90}`,
          link: '/leads',
          meta: `Stage: ${l.status} • Email: ${l.email || 'N/A'}`,
        })),
      });
    }

    // 7. General Executive Overview RAG
    const totalPipelineValue = deals.reduce((a, b) => a + (Number(b.value) || 0), 0);
    const totalInvoiced = invoices.reduce((a, b) => a + (Number(b.amount) || 0), 0);

    const generalAnswer = `### 🧠 AgencyFlow AI Knowledge Brain Summary:

I analyzed your workspace database across **${leads.length} Leads**, **${projects.length} Active Projects**, **${tasks.length} Tasks**, and **${invoices.length} Invoices**.

Here are your key agency performance indicators:

1. **Sales & Pipeline**:
   - Total Deals Volume: **$${totalPipelineValue.toLocaleString()}**
   - Qualified High-Score Prospects: **${leads.filter((l) => (l.leadScore || 0) >= 80).length}**
2. **Delivery & Projects**:
   - Active Client Projects: **${projects.length}** ($${projects.reduce((a, b) => a + (Number(b.budget) || 0), 0).toLocaleString()} contract value)
   - On Track Delivery Rate: **${projects.length > 0 ? Math.round((projects.filter((p) => p.status === 'ON TRACK').length / projects.length) * 100) : 100}%**
3. **Cashflow & Collections**:
   - Total Invoiced: **$${totalInvoiced.toLocaleString()}**
   - Paid Cash: **$${invoices.filter((i) => i.status === 'PAID').reduce((a, b) => a + (Number(b.amount) || 0), 0).toLocaleString()}**
4. **Sprint & Tasks**:
   - Open Tasks: **${tasks.filter((t) => t.status !== 'COMPLETED').length}** remaining

You can ask me to draft emails, analyze specific clients (e.g. *Mohmand* or *Apex*), create tasks, or diagnose project risks!`;

    return NextResponse.json({
      success: true,
      answer: generalAnswer,
      cards: [
        { title: 'Pipeline Leads', type: 'Leads', badge: `${leads.length} Records`, link: '/leads', meta: 'AI Scored' },
        { title: 'Project Delivery', type: 'Projects', badge: `${projects.length} Active`, link: '/projects', meta: 'Milestones & Roadmaps' },
        { title: 'Task Board', type: 'Tasks', badge: `${tasks.length} Sprint Items`, link: '/tasks', meta: 'Kanban Matrix' },
        { title: 'Billing & Invoices', type: 'Invoices', badge: `$${totalInvoiced.toLocaleString()}`, link: '/invoices', meta: 'Cashflow Hub' },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
