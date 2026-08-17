import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function exportSqliteData() {
  console.log('📦 Exporting existing SQLite database records for PostgreSQL migration...\n');

  const workspaces = await prisma.workspace.findMany();
  const users = await prisma.user.findMany();
  const companies = await prisma.company.findMany();
  const contacts = await prisma.contact.findMany();
  const leads = await prisma.lead.findMany();
  const deals = await prisma.deal.findMany();
  const activities = await prisma.activity.findMany();
  const tasks = await prisma.task.findMany();
  const projects = await prisma.project.findMany();
  const deliverables = await prisma.deliverable.findMany();
  const invoices = await prisma.invoice.findMany();
  const proposals = await prisma.proposal.findMany();
  const fileRecords = await prisma.fileRecord.findMany();
  const invitations = await prisma.invitation.findMany();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    sourceDatabase: 'SQLite',
    counts: {
      workspaces: workspaces.length,
      users: users.length,
      companies: companies.length,
      contacts: contacts.length,
      leads: leads.length,
      deals: deals.length,
      activities: activities.length,
      tasks: tasks.length,
      projects: projects.length,
      deliverables: deliverables.length,
      invoices: invoices.length,
      proposals: proposals.length,
      fileRecords: fileRecords.length,
      invitations: invitations.length,
    },
    data: {
      workspaces,
      users,
      companies,
      contacts,
      leads,
      deals,
      activities,
      tasks,
      projects,
      deliverables,
      invoices,
      proposals,
      fileRecords,
      invitations,
    },
  };

  const exportDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportFilePath = path.join(exportDir, 'sqlite-data-export.json');
  fs.writeFileSync(exportFilePath, JSON.stringify(exportPayload, null, 2), 'utf-8');

  console.log('✅ SQLite data successfully exported to:', exportFilePath);
  console.log('Record Summary:', JSON.stringify(exportPayload.counts, null, 2));
}

exportSqliteData()
  .catch((err) => {
    console.error('Export failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
