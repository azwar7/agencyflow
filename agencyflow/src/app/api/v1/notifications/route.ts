import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export interface RealNotification {
  id: string;
  category: 'LEAD' | 'OUTREACH' | 'TASK' | 'DELIVERABLE' | 'DEAL';
  title: string;
  desc: string;
  timestamp: string;
  timeAgo: string;
  icon: string;
  color: string;
  path: string;
  isRead?: boolean;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: { message: 'No workspace context found' } }, { status: 401 });
    }

    // 1. Fetch Real Leads (last 8) strictly for this workspace
    const recentLeads = await prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        source: true,
        status: true,
        createdAt: true,
      },
    });

    // 2. Fetch Real Outreach Emails (last 8) strictly for this workspace
    const recentOutreach = await prisma.outreachEmail.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        leadId: true,
        subject: true,
        status: true,
        sentAt: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        lead: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    // 3. Fetch Real Tasks Pending or Nearing Due Date (next 8) strictly for this workspace
    const upcomingTasks = await prisma.task.findMany({
      where: {
        workspaceId,
        status: { not: 'COMPLETED' },
      },
      orderBy: { dueDate: 'asc' },
      take: 8,
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        createdAt: true,
      },
    });

    // 4. Fetch Real Deliverables with Approaching Deadlines strictly for this workspace
    const pendingDeliverables = await prisma.deliverable.findMany({
      where: {
        workspaceId,
        statusType: { not: 'approved' },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        statusType: true,
        dueDate: true,
        createdAt: true,
      },
    });

    // 5. Fetch Recent Deals with Updates strictly for this workspace
    const recentDeals = await prisma.deal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        stage: true,
        value: true,
        createdAt: true,
        company: { select: { name: true } },
      },
    });

    const notifications: RealNotification[] = [];

    // Map Recent Leads
    for (const lead of recentLeads) {
      notifications.push({
        id: `lead_${lead.id}`,
        category: 'LEAD',
        title: `New Lead: ${lead.firstName} ${lead.lastName}`.trim(),
        desc: `${lead.companyName ? lead.companyName + ' • ' : ''}Source: ${lead.source || 'Website Inbound'}`,
        timestamp: lead.createdAt.toISOString(),
        timeAgo: getTimeAgo(lead.createdAt),
        icon: 'person_add',
        color: '#38bdf8',
        path: `/leads?leadId=${lead.id}`,
      });
    }

    // Map Outreach Emails
    for (const email of recentOutreach) {
      const recipient = email.lead?.email || `${email.lead?.firstName || ''} ${email.lead?.lastName || ''}`.trim() || 'prospect';
      if (email.status === 'SENT') {
        const time = email.sentAt || email.updatedAt;
        notifications.push({
          id: `outreach_sent_${email.id}`,
          category: 'OUTREACH',
          title: 'Outreach Email Delivered 🚀',
          desc: `Sent to ${recipient}: "${email.subject.slice(0, 45)}..."`,
          timestamp: time.toISOString(),
          timeAgo: getTimeAgo(time),
          icon: 'mark_email_read',
          color: '#4edea3',
          path: `/leads?leadId=${email.leadId}`,
        });
      } else if (email.status === 'FAILED') {
        notifications.push({
          id: `outreach_failed_${email.id}`,
          category: 'OUTREACH',
          title: '⚠️ Outreach Delivery Failed',
          desc: email.failureReason || `Failed to deliver email to ${recipient}`,
          timestamp: email.updatedAt.toISOString(),
          timeAgo: getTimeAgo(email.updatedAt),
          icon: 'error',
          color: '#f87171',
          path: `/leads?leadId=${email.leadId}`,
        });
      }
    }

    // Map Upcoming Tasks & Deadlines
    const now = new Date();
    for (const task of upcomingTasks) {
      const isOverdue = task.dueDate && new Date(task.dueDate) < now;
      const isDueSoon = task.dueDate && Math.abs(new Date(task.dueDate).getTime() - now.getTime()) < 48 * 3600 * 1000;
      
      notifications.push({
        id: `task_${task.id}`,
        category: 'TASK',
        title: isOverdue ? '⚠️ Task Overdue' : isDueSoon ? '⏰ Task Due Soon' : 'Pending Task',
        desc: `"${task.title}" • Priority: ${task.priority}`,
        timestamp: task.dueDate ? new Date(task.dueDate).toISOString() : task.createdAt.toISOString(),
        timeAgo: task.dueDate ? getTimeAgo(new Date(task.dueDate)) : getTimeAgo(task.createdAt),
        icon: isOverdue ? 'priority_high' : 'schedule',
        color: isOverdue ? '#f87171' : '#fbbf24',
        path: '/tasks',
      });
    }

    // Map Deliverables
    for (const d of pendingDeliverables) {
      notifications.push({
        id: `deliverable_${d.id}`,
        category: 'DELIVERABLE',
        title: `Deliverable: ${d.title}`,
        desc: `Status: ${d.status}${d.dueDate ? ' • Due: ' + new Date(d.dueDate).toLocaleDateString() : ''}`,
        timestamp: d.dueDate ? new Date(d.dueDate).toISOString() : d.createdAt.toISOString(),
        timeAgo: d.dueDate ? getTimeAgo(new Date(d.dueDate)) : getTimeAgo(d.createdAt),
        icon: 'inventory_2',
        color: '#c084fc',
        path: '/deliverables',
      });
    }

    // Map Deals
    for (const deal of recentDeals) {
      notifications.push({
        id: `deal_${deal.id}`,
        category: 'DEAL',
        title: `Deal Stage: ${deal.title}`,
        desc: `${deal.company?.name ? deal.company.name + ' • ' : ''}Stage: ${deal.stage} • $${(deal.value || 0).toLocaleString()}`,
        timestamp: deal.createdAt.toISOString(),
        timeAgo: getTimeAgo(deal.createdAt),
        icon: 'monetization_on',
        color: '#34d399',
        path: '/pipeline',
      });
    }

    // Sort all notifications chronologically (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Cap at 15 most relevant real events
    const topNotifications = notifications.slice(0, 15);

    return NextResponse.json({
      success: true,
      data: {
        workspaceId,
        notifications: topNotifications,
        total: topNotifications.length,
      },
    });
  } catch (error: any) {
    console.error('[Notifications API] Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch notifications' } },
      { status: 500 }
    );
  }
}
