import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function verifyPostgresImport() {
  console.log('🔍 Running Post-Import Database Integrity & Fidelity Verification...\n');

  const exportFilePath = path.join(process.cwd(), 'backups', 'sqlite-data-export.json');
  const raw = fs.readFileSync(exportFilePath, 'utf-8');
  const payload = JSON.parse(raw);
  const sourceData = payload.data;
  const expected = payload.counts;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Source Entity Fidelity Checks
  console.log('--- 1. 1:1 Entity Existence & Data Fidelity ---');
  
  // Workspaces
  const wsIds = sourceData.workspaces.map((w: any) => w.id);
  const foundWs = await prisma.workspace.findMany({ where: { id: { in: wsIds } } });
  assert(foundWs.length === expected.workspaces, `All ${expected.workspaces} source workspaces exist in PostgreSQL (${foundWs.length}/${expected.workspaces})`);

  // Users
  const userIds = sourceData.users.map((u: any) => u.id);
  const foundUsers = await prisma.user.findMany({ where: { id: { in: userIds } } });
  assert(foundUsers.length === expected.users, `All ${expected.users} source users exist in PostgreSQL (${foundUsers.length}/${expected.users})`);

  // Companies
  const companyIds = sourceData.companies.map((c: any) => c.id);
  const foundCompanies = await prisma.company.findMany({ where: { id: { in: companyIds } } });
  assert(foundCompanies.length === expected.companies, `All ${expected.companies} source companies exist in PostgreSQL (${foundCompanies.length}/${expected.companies})`);

  // Contacts
  const contactIds = sourceData.contacts.map((c: any) => c.id);
  const foundContacts = await prisma.contact.findMany({ where: { id: { in: contactIds } } });
  assert(foundContacts.length === expected.contacts, `All ${expected.contacts} source contacts exist in PostgreSQL (${foundContacts.length}/${expected.contacts})`);

  // Leads
  const leadIds = sourceData.leads.map((l: any) => l.id);
  const foundLeads = await prisma.lead.findMany({ where: { id: { in: leadIds } } });
  assert(foundLeads.length === expected.leads, `All ${expected.leads} source leads exist in PostgreSQL (${foundLeads.length}/${expected.leads})`);

  // Deals
  const dealIds = sourceData.deals.map((d: any) => d.id);
  const foundDeals = await prisma.deal.findMany({ where: { id: { in: dealIds } } });
  assert(foundDeals.length === expected.deals, `All ${expected.deals} source deals exist in PostgreSQL (${foundDeals.length}/${expected.deals})`);

  // Tasks
  const taskIds = sourceData.tasks.map((t: any) => t.id);
  const foundTasks = await prisma.task.findMany({ where: { id: { in: taskIds } } });
  assert(foundTasks.length === expected.tasks, `All ${expected.tasks} source tasks exist in PostgreSQL (${foundTasks.length}/${expected.tasks})`);

  // Deliverables
  const delivIds = sourceData.deliverables.map((d: any) => d.id);
  const foundDelivs = await prisma.deliverable.findMany({ where: { id: { in: delivIds } } });
  assert(foundDelivs.length === expected.deliverables, `All ${expected.deliverables} source deliverables exist in PostgreSQL (${foundDelivs.length}/${expected.deliverables})`);

  // Activities
  const actIds = sourceData.activities.map((a: any) => a.id);
  const foundActs = await prisma.activity.findMany({ where: { id: { in: actIds } } });
  assert(foundActs.length === expected.activities, `All ${expected.activities} source activities exist in PostgreSQL (${foundActs.length}/${expected.activities})`);

  // 2. Foreign Key & Relation Consistency
  console.log('\n--- 2. Foreign Key & Relational Consistency ---');
  const allUsers = await prisma.user.findMany({ include: { workspace: true } });
  const orphanedUsers = allUsers.filter((u) => !u.workspace);
  assert(orphanedUsers.length === 0, 'Zero orphaned users (all users have valid workspaceId)');

  const allCompanies = await prisma.company.findMany({ include: { workspace: true } });
  const orphanedCompanies = allCompanies.filter((c) => !c.workspace);
  assert(orphanedCompanies.length === 0, 'Zero orphaned companies');

  const allContacts = await prisma.contact.findMany({ include: { workspace: true, company: true } });
  const orphanedContacts = allContacts.filter((c) => !c.workspace || (c.companyId && !c.company));
  assert(orphanedContacts.length === 0, 'Zero orphaned contacts');

  const allLeads = await prisma.lead.findMany({ include: { workspace: true, assignedTo: true } });
  const orphanedLeads = allLeads.filter((l) => !l.workspace || (l.assignedToId && !l.assignedTo));
  assert(orphanedLeads.length === 0, 'Zero orphaned leads');

  const allDeals = await prisma.deal.findMany({ include: { workspace: true, company: true, contact: true, assignedTo: true } });
  const orphanedDeals = allDeals.filter(
    (d) => !d.workspace || (d.companyId && !d.company) || (d.contactId && !d.contact) || (d.assignedToId && !d.assignedTo)
  );
  assert(orphanedDeals.length === 0, 'Zero orphaned deals');

  const allTasks = await prisma.task.findMany({ include: { workspace: true, assignedTo: true } });
  const orphanedTasks = allTasks.filter((t) => !t.workspace || !t.assignedTo);
  assert(orphanedTasks.length === 0, 'Zero orphaned tasks');

  const allActivities = await prisma.activity.findMany({ include: { workspace: true, user: true } });
  const orphanedActivities = allActivities.filter((a) => !a.workspace || !a.user);
  assert(orphanedActivities.length === 0, 'Zero orphaned activities');

  // 3. Password Hashes Verification
  console.log('\n--- 3. Password Hashes Integrity ---');
  const sourceUserMap = new Map(sourceData.users.map((u: any) => [u.id, u.passwordHash]));
  const mismatchedHashes = foundUsers.filter((u) => u.passwordHash !== sourceUserMap.get(u.id));
  assert(mismatchedHashes.length === 0, `All ${foundUsers.length} user password hashes preserved with 100% exact 1:1 fidelity`);

  // 4. Unique Constraints
  console.log('\n--- 4. Unique Constraint Integrity ---');
  const emails = allUsers.map((u) => u.email.toLowerCase());
  const uniqueEmails = new Set(emails);
  assert(emails.length === uniqueEmails.size, 'Zero duplicate user emails');

  const allWorkspaces = await prisma.workspace.findMany();
  const slugs = allWorkspaces.map((w) => w.slug);
  const uniqueSlugs = new Set(slugs);
  assert(slugs.length === uniqueSlugs.size, 'Zero duplicate workspace slugs');

  console.log('\n========================================');
  console.log(`Verification Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyPostgresImport()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
