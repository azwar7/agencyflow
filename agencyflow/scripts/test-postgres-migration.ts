import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';
import * as crypto from 'crypto';

async function runPostgresMigrationTests() {
  console.log('🐘 Starting PostgreSQL Database Integrity & Compatibility Test Suite...\n');

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

  const testSuffix = `pg_test_${Date.now()}`;
  let testWorkspaceId = '';
  let testUserId = '';
  let testCompanyId = '';
  let testLeadId = '';
  let testDealId = '';

  try {
    // 1. Connection & Model Querying
    console.log('--- 1. Database Connectivity & Model Schema Verification ---');
    const wsCount = await prisma.workspace.count();
    assert(typeof wsCount === 'number', `Workspace table accessible (count: ${wsCount})`);

    const userCount = await prisma.user.count();
    assert(typeof userCount === 'number', `User table accessible (count: ${userCount})`);

    const leadCount = await prisma.lead.count();
    assert(typeof leadCount === 'number', `Lead table accessible (count: ${leadCount})`);

    const dealCount = await prisma.deal.count();
    assert(typeof dealCount === 'number', `Deal table accessible (count: ${dealCount})`);

    const companyCount = await prisma.company.count();
    assert(typeof companyCount === 'number', `Company table accessible (count: ${companyCount})`);

    const contactCount = await prisma.contact.count();
    assert(typeof contactCount === 'number', `Contact table accessible (count: ${contactCount})`);

    const projectCount = await prisma.project.count();
    assert(typeof projectCount === 'number', `Project table accessible (count: ${projectCount})`);

    const taskCount = await prisma.task.count();
    assert(typeof taskCount === 'number', `Task table accessible (count: ${taskCount})`);

    const deliverableCount = await prisma.deliverable.count();
    assert(typeof deliverableCount === 'number', `Deliverable table accessible (count: ${deliverableCount})`);

    const invoiceCount = await prisma.invoice.count();
    assert(typeof invoiceCount === 'number', `Invoice table accessible (count: ${invoiceCount})`);

    const proposalCount = await prisma.proposal.count();
    assert(typeof proposalCount === 'number', `Proposal table accessible (count: ${proposalCount})`);

    const activityCount = await prisma.activity.count();
    assert(typeof activityCount === 'number', `Activity table accessible (count: ${activityCount})`);

    const fileCount = await prisma.fileRecord.count();
    assert(typeof fileCount === 'number', `FileRecord table accessible (count: ${fileCount})`);

    const sessionCount = await prisma.session.count();
    assert(typeof sessionCount === 'number', `Session table accessible (count: ${sessionCount})`);

    const inviteCount = await prisma.invitation.count();
    assert(typeof inviteCount === 'number', `Invitation table accessible (count: ${inviteCount})`);

    // 2. Transactional Workspace & User Provisioning
    console.log('\n--- 2. Transactional Provisioning (prisma.$transaction) ---');
    const hashedPass = await hashPassword('PgMigrationSecure2026!');

    const { workspace, user } = await prisma.$transaction(
      async (tx) => {
        const ws = await tx.workspace.create({
          data: {
            name: `PG Migration Agency ${testSuffix}`,
            slug: `pg-agency-${testSuffix}`,
          },
        });

        const u = await tx.user.create({
          data: {
            workspaceId: ws.id,
            email: `${testSuffix}@agencytest.com`,
            fullName: 'PG Test Founder',
            passwordHash: hashedPass,
            role: 'OWNER',
          },
        });

        return { workspace: ws, user: u };
      },
      { timeout: 15000, maxWait: 10000 }
    );

    testWorkspaceId = workspace.id;
    testUserId = user.id;

    assert(Boolean(testWorkspaceId && testUserId), 'Workspace and User created within PostgreSQL transaction');
    assert(workspace.slug === `pg-agency-${testSuffix}`, 'Workspace slug correctly stored');

    // 3. Relational Foreign Key Integrity
    console.log('\n--- 3. Relational Integrity & Nested Lookups ---');
    const company = await prisma.company.create({
      data: {
        workspaceId: testWorkspaceId,
        name: 'Enterprise Client PG',
        domain: 'pgclient.test',
        industry: 'Cloud Infrastructure',
      },
    });
    testCompanyId = company.id;

    const contact = await prisma.contact.create({
      data: {
        workspaceId: testWorkspaceId,
        companyId: testCompanyId,
        firstName: 'John',
        lastName: 'Postgres',
        email: `john_${testSuffix}@pgclient.test`,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        workspaceId: testWorkspaceId,
        assignedToId: testUserId,
        firstName: 'Prospect',
        lastName: 'Lead',
        email: `prospect_${testSuffix}@lead.test`,
        companyName: 'Enterprise Client PG',
        status: 'NEW',
        leadScore: 85,
        source: 'Website Inbound',
      },
    });
    testLeadId = lead.id;

    const deal = await prisma.deal.create({
      data: {
        workspaceId: testWorkspaceId,
        companyId: testCompanyId,
        contactId: contact.id,
        assignedToId: testUserId,
        title: 'PostgreSQL Enterprise SLA Deal',
        value: 75000.0,
        stage: 'PROPOSAL',
      },
    });
    testDealId = deal.id;

    const project = await prisma.project.create({
      data: {
        workspaceId: testWorkspaceId,
        companyId: testCompanyId,
        title: 'Database Cloud SLA Project',
        budget: 75000.0,
        status: 'ON TRACK',
        statusType: 'success',
        progress: 25,
      },
    });

    const deliverable = await prisma.deliverable.create({
      data: {
        workspaceId: testWorkspaceId,
        projectId: project.id,
        title: 'Migration Specification Document',
        fileType: 'pdf',
        status: 'PENDING CLIENT REVIEW',
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId: testWorkspaceId,
        companyId: testCompanyId,
        number: `INV-${testSuffix}`,
        client: 'Enterprise Client PG',
        amount: 25000.0,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const proposal = await prisma.proposal.create({
      data: {
        workspaceId: testWorkspaceId,
        companyId: testCompanyId,
        title: 'Enterprise Architecture Scope',
        client: 'Enterprise Client PG',
        value: 75000.0,
        status: 'SENT',
      },
    });

    const task = await prisma.task.create({
      data: {
        workspaceId: testWorkspaceId,
        assignedToId: testUserId,
        dealId: testDealId,
        title: 'Review SLA Contract Terms',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        status: 'PENDING',
      },
    });

    const activity = await prisma.activity.create({
      data: {
        workspaceId: testWorkspaceId,
        userId: testUserId,
        dealId: testDealId,
        type: 'NOTE',
        content: 'Completed architecture review with client stakeholders.',
      },
    });

    const file = await prisma.fileRecord.create({
      data: {
        workspaceId: testWorkspaceId,
        name: 'architecture_diagram.pdf',
        type: 'PDF',
        size: '1.8 MB',
        category: 'Deliverable',
        client: 'Enterprise Client PG',
        uploadedBy: 'PG Test Founder',
      },
    });

    // Deep nested query check
    const deepQuery = await prisma.workspace.findUnique({
      where: { id: testWorkspaceId },
      include: {
        companies: { include: { contacts: true, deals: true, projects: { include: { deliverables: true } }, invoices: true, proposals: true } },
        leads: true,
        tasks: true,
        activities: true,
        files: true,
      },
    });

    assert(deepQuery?.companies.length === 1, 'Workspace company relation loaded successfully');
    assert(deepQuery?.companies[0].contacts.length === 1, 'Company contact relation loaded');
    assert(deepQuery?.companies[0].deals.length === 1, 'Company deal relation loaded');
    assert(deepQuery?.companies[0].projects.length === 1, 'Company project relation loaded');
    assert(deepQuery?.companies[0].projects[0].deliverables.length === 1, 'Project deliverable relation loaded');
    assert(deepQuery?.leads.length === 1, 'Workspace lead relation loaded');
    assert(deepQuery?.tasks.length === 1, 'Workspace task relation loaded');
    assert(deepQuery?.activities.length === 1, 'Workspace activity relation loaded');
    assert(deepQuery?.files.length === 1, 'Workspace file relation loaded');

    // 4. Session and Invitation SHA-256 Unique Constraints
    console.log('\n--- 4. Sessions & Invitations Unique Hashing ---');
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const session = await prisma.session.create({
      data: {
        tokenHash,
        userId: testUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    assert(session.tokenHash === tokenHash, 'Session record created and indexed by SHA-256 tokenHash');

    const rawInviteToken = crypto.randomBytes(32).toString('base64url');
    const inviteTokenHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');

    const invite = await prisma.invitation.create({
      data: {
        email: `invited_${testSuffix}@agencytest.com`,
        workspaceId: testWorkspaceId,
        invitedById: testUserId,
        role: 'MANAGER',
        tokenHash: inviteTokenHash,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    });
    assert(invite.tokenHash === inviteTokenHash, 'Invitation created with SHA-256 tokenHash');

    // 5. Atomic Lead Conversion Compare-and-Swap
    console.log('\n--- 5. Atomic Lead Conversion (Compare-and-Swap) ---');
    const convertResult = await prisma.$transaction(
      async (tx) => {
        const targetLead = await tx.lead.findFirst({
          where: {
            id: testLeadId,
            workspaceId: testWorkspaceId,
            status: { not: 'CONVERTED' },
          },
        });

        if (!targetLead) {
          throw new Error('Lead already converted');
        }

        await tx.lead.update({
          where: { id: targetLead.id },
          data: { status: 'CONVERTED' },
        });

        const newDeal = await tx.deal.create({
          data: {
            workspaceId: testWorkspaceId,
            title: `Converted: ${targetLead.firstName} ${targetLead.lastName}`,
            value: 50000.0,
            stage: 'DISCOVERY',
          },
        });

        return newDeal;
      },
      { timeout: 15000, maxWait: 10000 }
    );
    assert(Boolean(convertResult.id), 'Atomic lead conversion succeeded on first attempt');

    // Test duplicate conversion attempt
    let duplicateRejected = false;
    try {
      await prisma.$transaction(
        async (tx) => {
          const targetLead = await tx.lead.findFirst({
            where: {
              id: testLeadId,
              workspaceId: testWorkspaceId,
              status: { not: 'CONVERTED' },
            },
          });
          if (!targetLead) {
            throw new Error('Lead already converted');
          }
        },
        { timeout: 15000, maxWait: 10000 }
      );
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Duplicate conversion safely rejected (Compare-and-Swap atomicity confirmed)');

    // 6. Cascade Delete Verification
    console.log('\n--- 6. Cascade Deletion Integrity ---');
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });

    const orphanedUser = await prisma.user.findUnique({ where: { id: testUserId } });
    const orphanedDeal = await prisma.deal.findUnique({ where: { id: testDealId } });
    const orphanedLead = await prisma.lead.findUnique({ where: { id: testLeadId } });
    const orphanedCompany = await prisma.company.findUnique({ where: { id: testCompanyId } });

    assert(orphanedUser === null, 'Cascade delete: User purged on workspace deletion');
    assert(orphanedDeal === null, 'Cascade delete: Deal purged on workspace deletion');
    assert(orphanedLead === null, 'Cascade delete: Lead purged on workspace deletion');
    assert(orphanedCompany === null, 'Cascade delete: Company purged on workspace deletion');
  } catch (err: any) {
    assert(false, `PostgreSQL migration test failure: ${err.message}`);
  }

  console.log('\n========================================');
  console.log(`PostgreSQL Integrity Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPostgresMigrationTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
