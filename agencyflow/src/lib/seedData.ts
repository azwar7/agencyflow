import { prisma } from './prisma';
import { hashPassword } from './password';

export async function seedDatabase() {
  // Clear existing records
  await prisma.activity.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});

  const defaultPasswordHash = await hashPassword('ApexDigital2026!');

  // 1. Create Organization Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Apex Digital Agency',
      slug: 'apex-digital',
    },
  });

  // 2. Create Users (Owner, Manager, Sales Rep)
  const owner = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      email: 'sarah@apexdigital.com',
      fullName: 'Sarah Jenkins',
      role: 'OWNER',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const manager = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      email: 'marcus@apexdigital.com',
      fullName: 'Marcus Vance',
      role: 'MANAGER',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    },
  });

  const rep = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      email: 'alex@apexdigital.com',
      fullName: 'Alex Rivera',
      role: 'SALES_REP',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 3. Companies
  const companyTechFlow = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'TechFlow Systems',
      domain: 'techflow.io',
      industry: 'Enterprise Software & Cloud',
    },
  });

  const companyElevate = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'Elevate Creative Co',
      domain: 'elevatecreative.com',
      industry: 'Direct-to-Consumer Brands',
    },
  });

  const companySummit = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'Summit Global Logistics',
      domain: 'summitlogistics.net',
      industry: 'Supply Chain & Logistics',
    },
  });

  // 4. Contacts
  const contactDavid = await prisma.contact.create({
    data: {
      workspaceId: workspace.id,
      companyId: companyTechFlow.id,
      firstName: 'David',
      lastName: 'Miller',
      email: 'dmiller@techflow.io',
      phone: '+1 (555) 234-8901',
      title: 'VP of Product Engineering',
    },
  });

  const contactRachel = await prisma.contact.create({
    data: {
      workspaceId: workspace.id,
      companyId: companyElevate.id,
      firstName: 'Rachel',
      lastName: 'Green',
      email: 'rachel@elevatecreative.com',
      phone: '+1 (555) 456-7812',
      title: 'Chief Marketing Officer',
    },
  });

  const contactJames = await prisma.contact.create({
    data: {
      workspaceId: workspace.id,
      companyId: companySummit.id,
      firstName: 'James',
      lastName: 'Wilson',
      email: 'jwilson@summitlogistics.net',
      phone: '+1 (555) 890-1234',
      title: 'VP of Global Operations',
    },
  });

  // 5. Leads
  const lead1 = await prisma.lead.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: rep.id,
      firstName: 'Michael',
      lastName: 'Chang',
      email: 'm.chang@nexuscloud.com',
      phone: '+1 (555) 912-3456',
      companyName: 'Nexus Cloud Infrastructure',
      status: 'QUALIFIED',
      leadScore: 88,
      aiSummary: 'High-intent technical buyer. Looking for custom WebApp redesign and security compliance audit. Budget range $45k-$60k.',
      source: 'Inbound Contact Form',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: rep.id,
      firstName: 'Sophia',
      lastName: 'Martinez',
      email: 'sophia@horizonmedia.co',
      phone: '+1 (555) 678-9012',
      companyName: 'Horizon Media Group',
      status: 'CONTACTED',
      leadScore: 62,
      aiSummary: 'Moderate interest. Exploring custom CRM pipeline integrations. Requested follow-up demo next Tuesday.',
      source: 'LinkedIn Outbound',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: manager.id,
      firstName: 'Robert',
      lastName: 'Vance',
      email: 'vance@vancecap.com',
      phone: '+1 (555) 345-6789',
      companyName: 'Vance Financial Capital',
      status: 'NEW',
      leadScore: 92,
      aiSummary: 'Enterprise decision maker. Urgent requirement for internal customer portal. Decision target within 14 days.',
      source: 'Executive Referral',
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: rep.id,
      firstName: 'Amanda',
      lastName: 'Foster',
      email: 'afoster@fosterlaw.com',
      phone: '+1 (555) 210-9876',
      companyName: 'Foster & Associates Law',
      status: 'UNQUALIFIED',
      leadScore: 24,
      aiSummary: 'Low budget sensitivity misaligned with agency retainer minimum ($15k+). Recommended self-serve template software.',
      source: 'Direct Website',
    },
  });

  // 6. Deals
  const deal1 = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      contactId: contactDavid.id,
      companyId: companyTechFlow.id,
      assignedToId: rep.id,
      title: 'TechFlow Cloud Portal Redesign',
      value: 48500.0,
      stage: 'NEGOTIATION',
      expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      contactId: contactRachel.id,
      companyId: companyElevate.id,
      assignedToId: rep.id,
      title: 'Elevate DTC Brand Campaign Engine',
      value: 28000.0,
      stage: 'PROPOSAL',
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      contactId: contactJames.id,
      companyId: companySummit.id,
      assignedToId: manager.id,
      title: 'Summit Operations Tracking System',
      value: 62000.0,
      stage: 'DISCOVERY',
      expectedCloseDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  });

  const deal4 = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      contactId: contactDavid.id,
      companyId: companyTechFlow.id,
      assignedToId: owner.id,
      title: 'TechFlow Q1 Annual Retainer',
      value: 75000.0,
      stage: 'CLOSED_WON',
      expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const deal5 = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      contactId: contactRachel.id,
      companyId: companyElevate.id,
      assignedToId: rep.id,
      title: 'Elevate Social Media Automation App',
      value: 18500.0,
      stage: 'CLOSED_LOST',
      lossReason: 'Selected competitor offering cheaper offshore rates.',
      expectedCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  // 7. Activities
  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      userId: rep.id,
      leadId: lead1.id,
      type: 'CALL',
      content: 'Completed 30-minute discovery call with Michael. Confirmed key technical scope and security requirements.',
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      userId: rep.id,
      dealId: deal1.id,
      type: 'STAGE_CHANGE',
      content: 'Moved deal from Proposal Sent to Contract Negotiation. Draft SLA submitted to legal team.',
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      userId: manager.id,
      leadId: lead3.id,
      type: 'NOTE',
      content: 'Reviewed executive referral notes. High probability account. Assigned top priority status.',
    },
  });

  // 8. Tasks
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: rep.id,
      leadId: lead1.id,
      title: 'Send formal MSA and statement of work proposal to Michael Chang',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'PENDING',
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: rep.id,
      dealId: deal2.id,
      title: 'Follow up with Rachel Green regarding proposal slide deck feedback',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM',
      status: 'PENDING',
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: manager.id,
      dealId: deal3.id,
      title: 'Schedule technical architecture review with Summit Logistics engineering team',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'PENDING',
    },
  });

  console.log('Seed completed successfully for Apex Digital Agency!');
  return { workspace, owner, manager, rep };
}
