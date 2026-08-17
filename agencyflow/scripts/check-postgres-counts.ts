import { prisma } from '../src/lib/prisma';

async function checkPostgresCounts() {
  const counts = {
    workspaces: await prisma.workspace.count(),
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    contacts: await prisma.contact.count(),
    leads: await prisma.lead.count(),
    deals: await prisma.deal.count(),
    activities: await prisma.activity.count(),
    tasks: await prisma.task.count(),
    projects: await prisma.project.count(),
    deliverables: await prisma.deliverable.count(),
    invoices: await prisma.invoice.count(),
    proposals: await prisma.proposal.count(),
    fileRecords: await prisma.fileRecord.count(),
    invitations: await prisma.invitation.count(),
    sessions: await prisma.session.count(),
  };

  console.log('Current PostgreSQL Record Counts:');
  console.log(JSON.stringify(counts, null, 2));
}

checkPostgresCounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
