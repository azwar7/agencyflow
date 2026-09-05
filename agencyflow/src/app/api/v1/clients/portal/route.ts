import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get('clientId')?.trim() || searchParams.get('leadId')?.trim();

    let workspaceId: string | null = null;
    let userFullName: string = 'Agency Lead';
    let allWorkspaceClients: Array<{ id: string; name: string; contactName: string; type: 'COMPANY' | 'LEAD' }> = [];

    // Attempt to resolve internal CRM user session
    try {
      const session = await getAuthSession(request);
      workspaceId = session.workspaceId;
      userFullName = session.fullName || 'Agency Lead';
    } catch {
      // Unauthenticated external client viewing direct portal link
    }

    // 1. Fetch all companies and leads in workspace (for Client Switcher)
    if (workspaceId) {
      const [companies, leads] = await Promise.all([
        prisma.company.findMany({
          where: { workspaceId },
          select: {
            id: true,
            name: true,
            contacts: {
              take: 1,
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.lead.findMany({
          where: { workspaceId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const companyItems = companies.map((c) => ({
        id: c.id,
        name: c.name,
        contactName: c.contacts[0] ? `${c.contacts[0].firstName} ${c.contacts[0].lastName}` : 'Primary Contact',
        type: 'COMPANY' as const,
      }));

      const leadItems = leads.map((l) => ({
        id: l.id,
        name: l.companyName || `${l.firstName} ${l.lastName}`,
        contactName: `${l.firstName} ${l.lastName}`,
        type: 'LEAD' as const,
      }));

      // Merge and deduplicate by name
      allWorkspaceClients = [...companyItems];
      for (const li of leadItems) {
        if (!allWorkspaceClients.some((ci) => ci.name.toLowerCase() === li.name.toLowerCase())) {
          allWorkspaceClients.push(li);
        }
      }
    }

    // 2. Resolve target ID (fallback to first workspace company/lead if none provided)
    let targetId = requestedId;
    if (!targetId && allWorkspaceClients.length > 0) {
      targetId = allWorkspaceClients[0].id;
    }

    if (!targetId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'No client or lead account specified.' },
        },
        { status: 404 }
      );
    }

    // 3. Resolve target entity: Check Company first, then Lead
    let targetCompany = await prisma.company.findFirst({
      where: workspaceId ? { id: targetId, workspaceId } : { id: targetId },
      include: {
        contacts: { orderBy: { createdAt: 'asc' } },
        deals: { orderBy: { createdAt: 'desc' } },
      },
    });

    let targetLead: any = null;

    if (!targetCompany) {
      // Look up in Lead table
      targetLead = await prisma.lead.findFirst({
        where: workspaceId ? { id: targetId, workspaceId } : { id: targetId },
        include: {
          tasks: { orderBy: { dueDate: 'asc' } },
          activities: {
            include: { user: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (targetLead && targetLead.companyName) {
        // Find if a company already exists for this lead's companyName
        targetCompany = await prisma.company.findFirst({
          where: workspaceId
            ? { name: targetLead.companyName, workspaceId }
            : { name: targetLead.companyName },
          include: {
            contacts: { orderBy: { createdAt: 'asc' } },
            deals: { orderBy: { createdAt: 'desc' } },
          },
        });
      }
    } else {
      // Find if there is a matching Lead by company name
      targetLead = await prisma.lead.findFirst({
        where: workspaceId
          ? { companyName: targetCompany.name, workspaceId }
          : { companyName: targetCompany.name },
        include: {
          tasks: { orderBy: { dueDate: 'asc' } },
          activities: {
            include: { user: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    if (!targetCompany && !targetLead) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Client or lead account not found in this workspace.' },
        },
        { status: 404 }
      );
    }

    // 4. Resolve client identity details
    const clientName =
      targetCompany?.name ||
      targetLead?.companyName ||
      (targetLead ? `${targetLead.firstName} ${targetLead.lastName}` : 'Client Account');

    const clientId = targetCompany?.id || targetLead?.id;

    // Resolve primary contact
    let contactFullName = '';
    let contactFirstName = '';
    let contactLastName = '';
    let contactEmail = '';
    let contactPhone = '';
    let contactTitle = 'Client Representative';
    let contactInitials = '';

    if (targetCompany?.contacts && targetCompany.contacts.length > 0) {
      const c = targetCompany.contacts[0];
      contactFirstName = c.firstName || '';
      contactLastName = c.lastName || '';
      contactFullName = `${c.firstName} ${c.lastName}`.trim();
      contactEmail = c.email || '';
      contactPhone = c.phone || '';
      contactTitle = c.title || 'Client Executive';
      contactInitials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase();
    } else if (targetLead) {
      contactFirstName = targetLead.firstName || '';
      contactLastName = targetLead.lastName || '';
      contactFullName = `${targetLead.firstName} ${targetLead.lastName}`.trim();
      contactEmail = targetLead.email || '';
      contactPhone = targetLead.phone || '';
      contactTitle = targetLead.companyName ? 'Company Representative' : 'Lead Contact';
      contactInitials = `${targetLead.firstName?.[0] || ''}${targetLead.lastName?.[0] || ''}`.toUpperCase();
    } else {
      contactFullName = clientName;
      contactFirstName = clientName.split(' ')[0] || 'Client';
      contactLastName = clientName.split(' ').slice(1).join(' ') || 'Contact';
      contactEmail = '';
      contactInitials = clientName.slice(0, 2).toUpperCase();
    }

    if (!contactInitials) contactInitials = clientName.slice(0, 2).toUpperCase();

    // 5. Gather all alias names for database lookups
    const nameFilters = [
      clientName,
      targetCompany?.name,
      targetLead?.companyName,
      targetLead ? `${targetLead.firstName} ${targetLead.lastName}` : null,
    ].filter(Boolean) as string[];

    // 6. Real Projects & Milestones from Database
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          ...(targetCompany?.id ? [{ companyId: targetCompany.id }] : []),
          { clientName: { in: nameFilters } },
        ],
      },
      include: {
        deliverables: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let projectPayload: {
      title: string;
      day: number;
      totalDays: number;
      elapsedPercent: number;
      targetDate: string;
      sprintTitle: string;
    } | null = null;

    let milestonesPayload: Array<{
      tag: string;
      title: string;
      status: 'COMPLETED' | 'ACTIVE' | 'LOCKED';
      date: string;
      metric: string;
    }> = [];

    if (projects.length > 0) {
      const p = projects[0];
      const createdDate = new Date(p.createdAt);
      const dueDate = p.dueDate ? new Date(p.dueDate) : null;
      const now = new Date();

      let totalDays = 30;
      if (dueDate && dueDate > createdDate) {
        totalDays = Math.max(1, Math.round((dueDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
      }
      const elapsedDays = Math.max(1, Math.min(totalDays, Math.round((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))));
      const elapsedPercent = p.progress > 0 ? p.progress : Math.min(100, Math.round((elapsedDays / totalDays) * 100));

      projectPayload = {
        title: p.title,
        day: elapsedDays,
        totalDays,
        elapsedPercent,
        targetDate: dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Flexible',
        sprintTitle: `${p.status || 'Active Sprint'} • ${p.progress}% Progress`,
      };

      if (p.deliverables.length > 0) {
        milestonesPayload = p.deliverables.map((d, idx) => {
          const sUpper = d.status.toUpperCase();
          let status: 'COMPLETED' | 'ACTIVE' | 'LOCKED' = 'LOCKED';
          if (sUpper.includes('APPROVED') || sUpper.includes('COMPLETED')) {
            status = 'COMPLETED';
          } else if (sUpper.includes('PENDING') || sUpper.includes('REVIEW') || sUpper.includes('PROGRESS')) {
            status = 'ACTIVE';
          }

          const dDate = d.dueDate
            ? new Date(d.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.sentDate
            ? new Date(d.sentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Scheduled';

          return {
            tag: `MILESTONE 0${idx + 1}`,
            title: d.title,
            status,
            date: dDate,
            metric: `${d.version || 'v1.0'} • ${(d.fileType || 'PDF').toUpperCase()}`,
          };
        });
      } else {
        milestonesPayload = [
          {
            tag: 'MILESTONE 01',
            title: p.title,
            status: 'ACTIVE',
            date: dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'In Progress',
            metric: `${p.progress}% Completed`,
          },
        ];
      }
    }

    // 7. Real Invoices from Database
    const dbInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          ...(targetCompany?.id ? [{ companyId: targetCompany.id }] : []),
          { client: { in: nameFilters } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const invoicesPayload = dbInvoices.map((inv) => {
      const isPaid = inv.status.toUpperCase() === 'PAID';
      const isOverdue = inv.status.toUpperCase() === 'OVERDUE';
      return {
        id: inv.id,
        number: inv.number,
        description: `${clientName} Invoiced Services`,
        amount: inv.amount,
        status: (isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'OUTSTANDING') as 'OUTSTANDING' | 'PAID' | 'OVERDUE',
        dueDate: inv.dueDate
          ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Due upon receipt',
      };
    });

    const outstandingInvoices = invoicesPayload.filter((i) => i.status !== 'PAID');
    const totalDueAmount = outstandingInvoices.reduce((sum, i) => sum + i.amount, 0);
    const earliestDueDate = outstandingInvoices[0]?.dueDate;

    // 8. Real Actions Required from Database (Deliverables pending client review, or tasks)
    let actionRequiredPayload: {
      id: string;
      title: string;
      specTitle: string;
      submittedMeta: string;
      document: {
        id: string;
        name: string;
        size: string;
        updated: string;
        type: string;
        description: string;
      };
    } | null = null;

    // Check deliverables pending review
    const pendingDeliverable = projects
      .flatMap((p) => p.deliverables)
      .find((d) => d.status.toUpperCase().includes('PENDING') || d.status.toUpperCase().includes('REVIEW'));

    if (pendingDeliverable) {
      actionRequiredPayload = {
        id: pendingDeliverable.id,
        title: '1 Deliverable Requires Your Sign-off',
        specTitle: pendingDeliverable.title,
        submittedMeta: `Submitted ${new Date(pendingDeliverable.sentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} by ${userFullName}`,
        document: {
          id: pendingDeliverable.id,
          name: pendingDeliverable.fileName || `${pendingDeliverable.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
          size: '2.4 MB',
          updated: new Date(pendingDeliverable.sentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          type: pendingDeliverable.fileType || 'pdf',
          description: `Deliverable document for ${clientName}. Client review and approval required.`,
        },
      };
    } else if (targetLead?.tasks && targetLead.tasks.length > 0) {
      const pendingTask = targetLead.tasks.find((t: any) => t.status === 'PENDING');
      if (pendingTask) {
        actionRequiredPayload = {
          id: pendingTask.id,
          title: 'Action Item Pending',
          specTitle: pendingTask.title,
          submittedMeta: `Due ${new Date(pendingTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Priority: ${pendingTask.priority}`,
          document: {
            id: pendingTask.id,
            name: `${pendingTask.title.slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, '_')}.task`,
            size: `${pendingTask.priority} Priority`,
            updated: new Date(pendingTask.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            type: 'doc',
            description: `Scheduled action item for ${clientName}.`,
          },
        };
      }
    }

    // 9. Real Files & Shared Resources from Database
    const dbFiles = await prisma.fileRecord.findMany({
      where: {
        client: { in: nameFilters },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also include deliverable attachments from real projects
    const deliverableFiles = projects
      .flatMap((p) => p.deliverables)
      .filter((d) => d.fileName)
      .map((d) => ({
        id: `deliv-file-${d.id}`,
        name: d.fileName as string,
        category: 'specs' as const,
        size: '2.5 MB',
        updated: new Date(d.sentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: (d.fileType?.toLowerCase() === 'zip' ? 'zip' : d.fileType?.toLowerCase() === 'doc' ? 'doc' : 'pdf') as 'pdf' | 'zip' | 'doc',
        description: `Project deliverable: ${d.title}`,
      }));

    // Map database files
    const fileRecordsMapped = dbFiles.map((f) => {
      const typeLower = f.type.toLowerCase();
      const normType: 'pdf' | 'zip' | 'doc' = typeLower.includes('zip') || typeLower.includes('archive')
        ? 'zip'
        : typeLower.includes('doc') || typeLower.includes('txt')
        ? 'doc'
        : 'pdf';

      const catLower = f.category.toLowerCase();
      const normCategory: 'specs' | 'assets' | 'contracts' = catLower.includes('contract') || catLower.includes('agreement')
        ? 'contracts'
        : catLower.includes('asset') || catLower.includes('brand') || catLower.includes('image')
        ? 'assets'
        : 'specs';

      return {
        id: f.id,
        name: f.name,
        category: normCategory,
        size: f.size || '1.2 MB',
        updated: new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: normType,
        description: `Uploaded document for ${clientName}.`,
      };
    });

    const allVaultFiles = [...deliverableFiles, ...fileRecordsMapped];
    const resourcesPayload = allVaultFiles.slice(0, 6);

    // 10. Real Activities from Database
    const dealIds = targetCompany?.deals?.map((d) => d.id) || [];
    const dbActivities = await prisma.activity.findMany({
      where: {
        OR: [
          ...(targetLead?.id ? [{ leadId: targetLead.id }] : []),
          ...(dealIds.length > 0 ? [{ dealId: { in: dealIds } }] : []),
        ],
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const activitiesPayload = dbActivities.map((act) => {
      const timeAgo = formatTimeAgo(new Date(act.createdAt));
      let actionPhrase = 'logged note for';
      let avatarClass = 'activity-avatar-purple';

      if (act.type === 'EMAIL') {
        actionPhrase = 'dispatched email to';
        avatarClass = 'activity-avatar-cyan';
      } else if (act.type === 'CALL') {
        actionPhrase = 'completed call regarding';
        avatarClass = 'activity-avatar-slate';
      } else if (act.type === 'MEETING') {
        actionPhrase = 'conducted meeting with';
        avatarClass = 'activity-avatar-purple';
      } else if (act.type === 'STAGE_CHANGE') {
        actionPhrase = 'updated deal stage for';
        avatarClass = 'activity-avatar-cyan';
      }

      const userName = act.user?.fullName || userFullName || 'Agency Team';
      const userInitials = act.user?.fullName
        ? act.user.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'AT';

      return {
        id: act.id,
        avatar: userInitials,
        avatarClass,
        userName,
        actionPhrase,
        objectTitle: clientName,
        supportingText: act.content.length > 120 ? `${act.content.slice(0, 120)}...` : act.content,
        time: timeAgo,
      };
    });

    // 11. Real Summary Stats
    const openTasksCount = (targetLead?.tasks?.filter((t: any) => t.status === 'PENDING').length || 0) +
      (pendingDeliverable ? 1 : 0);

    const summaryStats = {
      activeOpen: openTasksCount,
      activeSub: openTasksCount > 0 ? `${openTasksCount} action items pending` : 'No active items pending',
      unreadCount: 0,
      unreadSub: 'All messages caught up',
      vaultFilesCount: allVaultFiles.length,
      vaultSub: allVaultFiles.length > 0 ? `${allVaultFiles.length} files in vault` : 'No files uploaded yet',
      dueAmount: totalDueAmount,
      dueFormatted: totalDueAmount > 0 ? `$${totalDueAmount.toLocaleString()}` : '$0.00',
      dueDateText: totalDueAmount > 0 ? (earliestDueDate ? `Due ${earliestDueDate}` : 'Outstanding') : 'All settled ✓',
    };

    // 12. Return Real Database Payload
    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: clientId,
          name: clientName,
          domain: targetCompany?.domain || '',
          industry: targetCompany?.industry || 'Business Services',
          primaryContact: {
            fullName: contactFullName,
            firstName: contactFirstName,
            lastName: contactLastName,
            email: contactEmail,
            phone: contactPhone || '—',
            title: contactTitle,
            initials: contactInitials,
          },
        },
        project: projectPayload,
        milestones: milestonesPayload,
        actionRequired: actionRequiredPayload,
        summaryStats,
        resources: resourcesPayload,
        allVaultFiles,
        invoices: invoicesPayload,
        activities: activitiesPayload,
        allWorkspaceClients,
      },
    });
  } catch (error: any) {
    console.error('[Client Portal API] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to load client portal' } },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
