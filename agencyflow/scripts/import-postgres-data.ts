import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function retryOp<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.log(`⏳ Database connection retry (${i + 1}/${retries})...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Retries exceeded');
}

async function importPostgresData() {
  console.log('🚀 Importing SQLite export data into PostgreSQL (Neon)...\n');

  const exportFilePath = path.join(process.cwd(), 'backups', 'sqlite-data-export.json');
  if (!fs.existsSync(exportFilePath)) {
    throw new Error(`Export file not found at: ${exportFilePath}`);
  }

  const raw = fs.readFileSync(exportFilePath, 'utf-8');
  const payload = JSON.parse(raw);
  const data = payload.data;

  console.log(`Source records to import:`);
  console.log(`- Workspaces: ${data.workspaces.length}`);
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Companies: ${data.companies.length}`);
  console.log(`- Contacts: ${data.contacts.length}`);
  console.log(`- Leads: ${data.leads.length}`);
  console.log(`- Deals: ${data.deals.length}`);
  console.log(`- Activities: ${data.activities.length}`);
  console.log(`- Tasks: ${data.tasks.length}`);
  console.log(`- Deliverables: ${data.deliverables.length}`);
  console.log(`- Projects: ${data.projects.length}`);
  console.log(`- Invoices: ${data.invoices.length}`);
  console.log(`- Proposals: ${data.proposals.length}`);
  console.log(`- FileRecords: ${data.fileRecords.length}`);
  console.log(`- Invitations: ${data.invitations.length}\n`);

  // Initial connection wake-up
  await retryOp(async () => {
    await prisma.$connect();
  });

  // 1. Workspaces
  if (data.workspaces.length > 0) {
    const res = await retryOp(() =>
      prisma.workspace.createMany({
        data: data.workspaces.map((ws: any) => ({
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          createdAt: new Date(ws.createdAt),
          updatedAt: new Date(ws.updatedAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Workspaces imported: ${res.count}`);
  }

  // 2. Users (Sessions are intentionally NOT imported)
  if (data.users.length > 0) {
    const res = await retryOp(() =>
      prisma.user.createMany({
        data: data.users.map((u: any) => ({
          id: u.id,
          workspaceId: u.workspaceId,
          email: u.email,
          passwordHash: u.passwordHash,
          fullName: u.fullName,
          role: u.role,
          avatarUrl: u.avatarUrl,
          createdAt: new Date(u.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Users imported: ${res.count}`);
  }

  // 3. Companies
  if (data.companies.length > 0) {
    const res = await retryOp(() =>
      prisma.company.createMany({
        data: data.companies.map((c: any) => ({
          id: c.id,
          workspaceId: c.workspaceId,
          name: c.name,
          domain: c.domain,
          industry: c.industry,
          isSample: Boolean(c.isSample),
          createdAt: new Date(c.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Companies imported: ${res.count}`);
  }

  // 4. Contacts
  if (data.contacts.length > 0) {
    const res = await retryOp(() =>
      prisma.contact.createMany({
        data: data.contacts.map((c: any) => ({
          id: c.id,
          workspaceId: c.workspaceId,
          companyId: c.companyId,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          title: c.title,
          isSample: Boolean(c.isSample),
          createdAt: new Date(c.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Contacts imported: ${res.count}`);
  }

  // 5. Leads
  if (data.leads.length > 0) {
    const res = await retryOp(() =>
      prisma.lead.createMany({
        data: data.leads.map((l: any) => ({
          id: l.id,
          workspaceId: l.workspaceId,
          assignedToId: l.assignedToId,
          firstName: l.firstName,
          lastName: l.lastName,
          email: l.email,
          phone: l.phone,
          companyName: l.companyName,
          status: l.status,
          leadScore: l.leadScore || 0,
          aiSummary: l.aiSummary,
          source: l.source || 'Website Inbound',
          isSample: Boolean(l.isSample),
          createdAt: new Date(l.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Leads imported: ${res.count}`);
  }

  // 6. Deals
  if (data.deals.length > 0) {
    const res = await retryOp(() =>
      prisma.deal.createMany({
        data: data.deals.map((d: any) => ({
          id: d.id,
          workspaceId: d.workspaceId,
          contactId: d.contactId,
          companyId: d.companyId,
          assignedToId: d.assignedToId,
          title: d.title,
          value: Number(d.value) || 0.0,
          stage: d.stage,
          lossReason: d.lossReason,
          expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate) : null,
          isSample: Boolean(d.isSample),
          createdAt: new Date(d.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Deals imported: ${res.count}`);
  }

  // 7. Projects
  if (data.projects.length > 0) {
    const res = await retryOp(() =>
      prisma.project.createMany({
        data: data.projects.map((p: any) => ({
          id: p.id,
          workspaceId: p.workspaceId,
          companyId: p.companyId,
          title: p.title,
          clientName: p.clientName,
          status: p.status,
          statusType: p.statusType,
          progress: p.progress || 0,
          budget: Number(p.budget) || 0.0,
          dueDate: p.dueDate ? new Date(p.dueDate) : null,
          nextMilestone: p.nextMilestone,
          isSample: Boolean(p.isSample),
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Projects imported: ${res.count}`);
  }

  // 8. Tasks
  if (data.tasks.length > 0) {
    const res = await retryOp(() =>
      prisma.task.createMany({
        data: data.tasks.map((t: any) => ({
          id: t.id,
          workspaceId: t.workspaceId,
          assignedToId: t.assignedToId,
          leadId: t.leadId,
          dealId: t.dealId,
          title: t.title,
          dueDate: new Date(t.dueDate),
          priority: t.priority,
          status: t.status,
          isSample: Boolean(t.isSample),
          createdAt: new Date(t.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Tasks imported: ${res.count}`);
  }

  // 9. Deliverables
  if (data.deliverables.length > 0) {
    const res = await retryOp(() =>
      prisma.deliverable.createMany({
        data: data.deliverables.map((d: any) => ({
          id: d.id,
          workspaceId: d.workspaceId,
          projectId: d.projectId,
          title: d.title,
          fileName: d.fileName,
          fileType: d.fileType || 'pdf',
          status: d.status,
          statusType: d.statusType,
          version: d.version || 'v1.0',
          clientContact: d.clientContact,
          dueDate: d.dueDate ? new Date(d.dueDate) : null,
          sentDate: new Date(d.sentDate),
          accentColor: d.accentColor || '#ffb95f',
          isSample: Boolean(d.isSample),
          createdAt: new Date(d.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Deliverables imported: ${res.count}`);
  }

  // 10. Invoices
  if (data.invoices.length > 0) {
    const res = await retryOp(() =>
      prisma.invoice.createMany({
        data: data.invoices.map((i: any) => ({
          id: i.id,
          workspaceId: i.workspaceId,
          companyId: i.companyId,
          number: i.number,
          client: i.client,
          amount: Number(i.amount) || 0.0,
          status: i.status,
          issuedDate: new Date(i.issuedDate),
          dueDate: new Date(i.dueDate),
          isSample: Boolean(i.isSample),
          createdAt: new Date(i.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Invoices imported: ${res.count}`);
  }

  // 11. Proposals
  if (data.proposals.length > 0) {
    const res = await retryOp(() =>
      prisma.proposal.createMany({
        data: data.proposals.map((p: any) => ({
          id: p.id,
          workspaceId: p.workspaceId,
          companyId: p.companyId,
          title: p.title,
          client: p.client,
          value: Number(p.value) || 0.0,
          status: p.status,
          preparedBy: p.preparedBy,
          acceptedBy: p.acceptedBy,
          acceptedTitle: p.acceptedTitle,
          date: new Date(p.date),
          isSample: Boolean(p.isSample),
          createdAt: new Date(p.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Proposals imported: ${res.count}`);
  }

  // 12. Activities
  if (data.activities.length > 0) {
    const res = await retryOp(() =>
      prisma.activity.createMany({
        data: data.activities.map((a: any) => ({
          id: a.id,
          workspaceId: a.workspaceId,
          userId: a.userId,
          leadId: a.leadId,
          dealId: a.dealId,
          type: a.type,
          content: a.content,
          isSample: Boolean(a.isSample),
          createdAt: new Date(a.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Activities imported: ${res.count}`);
  }

  // 13. FileRecords
  if (data.fileRecords.length > 0) {
    const res = await retryOp(() =>
      prisma.fileRecord.createMany({
        data: data.fileRecords.map((f: any) => ({
          id: f.id,
          workspaceId: f.workspaceId,
          name: f.name,
          type: f.type,
          size: f.size,
          category: f.category,
          client: f.client,
          project: f.project,
          uploadedBy: f.uploadedBy,
          isSample: Boolean(f.isSample),
          createdAt: new Date(f.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ FileRecords imported: ${res.count}`);
  }

  // 14. Invitations
  if (data.invitations.length > 0) {
    const res = await retryOp(() =>
      prisma.invitation.createMany({
        data: data.invitations.map((inv: any) => ({
          id: inv.id,
          email: inv.email,
          workspaceId: inv.workspaceId,
          invitedById: inv.invitedById,
          role: inv.role,
          tokenHash: inv.tokenHash,
          expiresAt: new Date(inv.expiresAt),
          acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt) : null,
          createdAt: new Date(inv.createdAt),
        })),
        skipDuplicates: true,
      })
    );
    console.log(`✅ Invitations imported: ${res.count}`);
  }

  console.log('\n🎉 ALL DATA SUCCESSFULLY IMPORTED INTO POSTGRESQL!\n');
}

importPostgresData()
  .catch((err) => {
    console.error('Import error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
