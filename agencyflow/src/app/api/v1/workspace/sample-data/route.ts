import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const count = await prisma.lead.count({
      where: { workspaceId: session.workspaceId, isSample: true },
    });
    return NextResponse.json({ success: true, data: { isSampleData: count > 0 } });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    // RBAC: Loading sample data requires OWNER or ADMIN role
    requireRole(session, ['OWNER', 'ADMIN']);

    const workspaceId = session.workspaceId;

    // First delete any previous sample data to avoid duplicates
    await clearWorkspaceSampleData(workspaceId);

    // 1. Create Sample Companies
    const companyTechFlow = await prisma.company.create({
      data: {
        workspaceId,
        name: 'TechFlow Systems',
        domain: 'techflow.io',
        industry: 'Enterprise Software & Cloud',
        isSample: true,
      },
    });

    const companyElevate = await prisma.company.create({
      data: {
        workspaceId,
        name: 'Elevate Creative Co.',
        domain: 'elevatecreative.com',
        industry: 'Direct-to-Consumer Brands',
        isSample: true,
      },
    });

    const companySummit = await prisma.company.create({
      data: {
        workspaceId,
        name: 'Summit Global Logistics',
        domain: 'summitlogistics.net',
        industry: 'Supply Chain & Freight',
        isSample: true,
      },
    });

    // 2. Create Sample Contacts
    const contactDavid = await prisma.contact.create({
      data: {
        workspaceId,
        companyId: companyTechFlow.id,
        firstName: 'David',
        lastName: 'Miller',
        email: 'dmiller@techflow.io',
        phone: '+1 (555) 234-8901',
        title: 'VP of Product Engineering',
        isSample: true,
      },
    });

    const contactRachel = await prisma.contact.create({
      data: {
        workspaceId,
        companyId: companyElevate.id,
        firstName: 'Rachel',
        lastName: 'Green',
        email: 'rachel@elevatecreative.com',
        phone: '+1 (555) 345-6789',
        title: 'Founder & Creative Director',
        isSample: true,
      },
    });

    // 3. Create Sample Leads
    await prisma.lead.createMany({
      data: [
        {
          workspaceId,
          assignedToId: session.userId,
          firstName: 'Marcus',
          lastName: 'Vance',
          email: 'marcus@nexustech.io',
          phone: '+1 (555) 890-1234',
          companyName: 'Nexus Tech Systems',
          status: 'QUALIFIED',
          leadScore: 92,
          source: 'Website Inbound',
          aiSummary: 'Enterprise inquiry with $45K budget for Q3 CRM rebuild.',
          isSample: true,
        },
        {
          workspaceId,
          assignedToId: session.userId,
          firstName: 'Elena',
          lastName: 'Rostova',
          email: 'elena@vanguardfintech.com',
          phone: '+1 (555) 678-9012',
          companyName: 'Vanguard FinTech Group',
          status: 'CONTACTED',
          leadScore: 78,
          source: 'Referral Partner',
          aiSummary: 'Interested in React Native mobile development retainer.',
          isSample: true,
        },
        {
          workspaceId,
          assignedToId: session.userId,
          firstName: 'John',
          lastName: 'Summit',
          email: 'john@summitlogistics.net',
          phone: '+1 (555) 456-7890',
          companyName: 'Summit Global Logistics',
          status: 'NEW',
          leadScore: 65,
          source: 'LinkedIn Outreach',
          aiSummary: 'Operations manager exploring automated dispatch portal.',
          isSample: true,
        },
      ],
    });

    // 4. Create Sample Deals
    await prisma.deal.createMany({
      data: [
        {
          workspaceId,
          companyId: companyElevate.id,
          contactId: contactRachel.id,
          assignedToId: session.userId,
          title: 'Elevate DTC Brand Campaign Engine',
          value: 36000,
          stage: 'PROPOSAL',
          isSample: true,
        },
        {
          workspaceId,
          companyId: companyTechFlow.id,
          contactId: contactDavid.id,
          assignedToId: session.userId,
          title: 'TechFlow Cloud Portal Re-architecture',
          value: 48000,
          stage: 'NEGOTIATION',
          isSample: true,
        },
        {
          workspaceId,
          companyId: companySummit.id,
          assignedToId: session.userId,
          title: 'Summit Operations Tracking System',
          value: 24000,
          stage: 'CLOSED_WON',
          isSample: true,
        },
      ],
    });

    // 5. Create Sample Tasks
    await prisma.task.createMany({
      data: [
        {
          workspaceId,
          assignedToId: session.userId,
          title: 'Send formal MSA and proposal deck to Rachel Green',
          dueDate: new Date(Date.now() + 86400000),
          priority: 'HIGH',
          status: 'PENDING',
          isSample: true,
        },
        {
          workspaceId,
          assignedToId: session.userId,
          title: 'Technical architecture call with David Miller',
          dueDate: new Date(Date.now() + 86400000 * 2),
          priority: 'MEDIUM',
          status: 'PENDING',
          isSample: true,
        },
        {
          workspaceId,
          assignedToId: session.userId,
          title: 'Review Q3 deliverables timeline with client',
          dueDate: new Date(Date.now() + 86400000 * 4),
          priority: 'LOW',
          status: 'PENDING',
          isSample: true,
        },
      ],
    });

    // 6. Create Sample Projects
    const project1 = await prisma.project.create({
      data: {
        workspaceId,
        companyId: companyTechFlow.id,
        clientName: 'TechFlow Systems',
        title: 'TechFlow Cloud Portal Re-architecture',
        status: 'ON TRACK',
        statusType: 'success',
        progress: 68,
        budget: 48000,
        nextMilestone: 'Phase 3 API Security Audit',
        dueDate: new Date(Date.now() + 86400000 * 14),
        isSample: true,
      },
    });

    const project2 = await prisma.project.create({
      data: {
        workspaceId,
        companyId: companyElevate.id,
        clientName: 'Elevate Creative Co.',
        title: 'Acme Brand Identity Refresh',
        status: 'AT RISK',
        statusType: 'warning',
        progress: 42,
        budget: 32500,
        nextMilestone: 'Concept Presentation',
        dueDate: new Date(Date.now() + 86400000 * 8),
        isSample: true,
      },
    });

    // 7. Create Sample Deliverables
    await prisma.deliverable.createMany({
      data: [
        {
          workspaceId,
          projectId: project1.id,
          title: 'v2.4_Database_Schema_Architecture.pdf',
          fileName: 'v2.4_Database_Schema_Architecture.pdf',
          fileType: 'pdf',
          status: 'PENDING CLIENT REVIEW',
          statusType: 'pending',
          version: 'v2.4',
          clientContact: 'Marcus Vance',
          accentColor: '#ffb95f',
          isSample: true,
        },
        {
          workspaceId,
          projectId: project2.id,
          title: 'Brand_Identity_Guidelines_Final.zip',
          fileName: 'Brand_Identity_Guidelines_Final.zip',
          fileType: 'zip',
          status: 'APPROVED',
          statusType: 'approved',
          version: 'v1.0',
          clientContact: 'Alex Rivera',
          accentColor: '#4edea3',
          isSample: true,
        },
        {
          workspaceId,
          projectId: project1.id,
          title: 'Figma_HighFidelity_Flow_v3.fig',
          fileName: 'Figma_HighFidelity_Flow_v3.fig',
          fileType: 'figma',
          status: 'REVISION REQUESTED',
          statusType: 'revisions',
          version: 'v3.1',
          clientContact: 'Elena Rostova',
          accentColor: '#ef4444',
          isSample: true,
        },
      ],
    });

    // 8. Create Sample Invoices
    await prisma.invoice.createMany({
      data: [
        {
          workspaceId,
          companyId: companyElevate.id,
          number: 'INV-2026-094',
          client: 'Elevate Creative Co.',
          amount: 28000,
          status: 'PAID',
          issuedDate: new Date(Date.now() - 86400000 * 14),
          dueDate: new Date(Date.now() + 86400000),
          isSample: true,
        },
        {
          workspaceId,
          companyId: companyTechFlow.id,
          number: 'INV-2026-095',
          client: 'TechFlow Systems',
          amount: 14500,
          status: 'PENDING',
          issuedDate: new Date(Date.now() - 86400000 * 7),
          dueDate: new Date(Date.now() + 86400000 * 5),
          isSample: true,
        },
        {
          workspaceId,
          companyId: companySummit.id,
          number: 'INV-2026-092',
          client: 'Summit Logistics',
          amount: 42000,
          status: 'OVERDUE',
          issuedDate: new Date(Date.now() - 86400000 * 30),
          dueDate: new Date(Date.now() - 86400000 * 5),
          isSample: true,
        },
      ],
    });

    // 9. Create Sample Proposals
    await prisma.proposal.createMany({
      data: [
        {
          workspaceId,
          companyId: companyElevate.id,
          title: 'Elevate DTC Brand Campaign Engine SOW',
          client: 'Elevate Creative Co.',
          value: 36000,
          status: 'SENT',
          preparedBy: 'David Miller',
          acceptedBy: 'Rachel Green',
          acceptedTitle: 'CEO, Elevate Creative Co.',
          isSample: true,
        },
        {
          workspaceId,
          companyId: companySummit.id,
          title: 'Summit Logistics Operations Architecture',
          client: 'Summit Logistics',
          value: 48000,
          status: 'ACCEPTED',
          preparedBy: 'Marcus Vance',
          acceptedBy: 'John Summit',
          acceptedTitle: 'VP Operations',
          isSample: true,
        },
      ],
    });

    // 10. Create Sample Files
    await prisma.fileRecord.createMany({
      data: [
        {
          workspaceId,
          name: 'Elevate_DTC_Master_Services_Agreement_2026.pdf',
          type: 'PDF',
          size: '4.8 MB',
          category: 'Contract',
          client: 'Elevate Creative Co.',
          project: 'DTC Brand Campaign Engine',
          uploadedBy: 'David Miller',
          isSample: true,
        },
        {
          workspaceId,
          name: 'Summit_Logistics_Architecture_Blueprint_v2.1.pdf',
          type: 'PDF',
          size: '12.4 MB',
          category: 'Deliverable',
          client: 'Summit Logistics',
          project: 'Summit Operations Tracking System',
          uploadedBy: 'Marcus Vance',
          isSample: true,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Sample demo data successfully loaded into workspace.',
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession(request);
    // RBAC: Resetting/deleting sample data requires OWNER or ADMIN role
    requireRole(session, ['OWNER', 'ADMIN']);

    await clearWorkspaceSampleData(session.workspaceId);

    return NextResponse.json({
      success: true,
      message: 'Sample data removed. Workspace reset to clean empty state.',
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

async function clearWorkspaceSampleData(workspaceId: string) {
  await prisma.activity.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.fileRecord.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.proposal.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.invoice.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.deliverable.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.project.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.task.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.deal.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.lead.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.contact.deleteMany({ where: { workspaceId, isSample: true } });
  await prisma.company.deleteMany({ where: { workspaceId, isSample: true } });
}
