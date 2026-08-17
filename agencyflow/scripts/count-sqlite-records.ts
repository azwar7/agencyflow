import { prisma } from '../src/lib/prisma';

async function main() {
  const workspaces = await prisma.workspace.count();
  const users = await prisma.user.count();
  const sessions = await prisma.session.count();
  const invitations = await prisma.invitation.count();
  const leads = await prisma.lead.count();
  const deals = await prisma.deal.count();
  const companies = await prisma.company.count();
  const contacts = await prisma.contact.count();
  const projects = await prisma.project.count();
  const tasks = await prisma.task.count();
  const deliverables = await prisma.deliverable.count();
  const invoices = await prisma.invoice.count();
  const proposals = await prisma.proposal.count();
  const activities = await prisma.activity.count();
  const files = await prisma.fileRecord.count();

  console.log(JSON.stringify({
    workspaces,
    users,
    sessions,
    invitations,
    leads,
    deals,
    companies,
    contacts,
    projects,
    tasks,
    deliverables,
    invoices,
    proposals,
    activities,
    files
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
