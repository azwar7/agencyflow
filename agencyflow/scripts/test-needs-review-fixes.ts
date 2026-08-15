import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

async function runNeedsReviewSecurityTests() {
  console.log('🛡️  Running Comprehensive Security Suite for Foreign-Key Boundaries & RBAC...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();

    // 1. Create Workspace A with OWNER, ADMIN, MANAGER, SALES_REP, MEMBER
    const wsA = await prisma.workspace.create({
      data: { name: `Tenant A ${timestamp}`, slug: `tenant-a-${timestamp}` },
    });

    const ownerA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: `owner_a_${timestamp}@tenanta.com`,
        fullName: 'Alice Owner A',
        role: 'OWNER',
        passwordHash: await hashPassword('Pass123!'),
      },
    });
    const { rawToken: tokenOwnerA } = await createSession(ownerA.id);
    const cookieOwnerA = `${SESSION_COOKIE_NAME}=${tokenOwnerA}`;

    const adminA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: `admin_a_${timestamp}@tenanta.com`,
        fullName: 'Adam Admin A',
        role: 'ADMIN',
        passwordHash: await hashPassword('Pass123!'),
      },
    });
    const { rawToken: tokenAdminA } = await createSession(adminA.id);
    const cookieAdminA = `${SESSION_COOKIE_NAME}=${tokenAdminA}`;

    const managerA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: `manager_a_${timestamp}@tenanta.com`,
        fullName: 'Mary Manager A',
        role: 'MANAGER',
        passwordHash: await hashPassword('Pass123!'),
      },
    });
    const { rawToken: tokenManagerA } = await createSession(managerA.id);
    const cookieManagerA = `${SESSION_COOKIE_NAME}=${tokenManagerA}`;

    const repA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: `rep_a_${timestamp}@tenanta.com`,
        fullName: 'Rachel Rep A',
        role: 'SALES_REP',
        passwordHash: await hashPassword('Pass123!'),
      },
    });
    const { rawToken: tokenRepA } = await createSession(repA.id);
    const cookieRepA = `${SESSION_COOKIE_NAME}=${tokenRepA}`;

    const memberA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: `member_a_${timestamp}@tenanta.com`,
        fullName: 'Mike Member A',
        role: 'MEMBER',
        passwordHash: await hashPassword('Pass123!'),
      },
    });
    const { rawToken: tokenMemberA } = await createSession(memberA.id);
    const cookieMemberA = `${SESSION_COOKIE_NAME}=${tokenMemberA}`;

    // 2. Create Workspace B with OWNER and private resources
    const wsB = await prisma.workspace.create({
      data: { name: `Tenant B ${timestamp}`, slug: `tenant-b-${timestamp}` },
    });

    const userB = await prisma.user.create({
      data: {
        workspaceId: wsB.id,
        email: `user_b_${timestamp}@tenantb.com`,
        fullName: 'Bob User B',
        role: 'OWNER',
        passwordHash: await hashPassword('Pass123!'),
      },
    });

    const companyB = await prisma.company.create({
      data: { workspaceId: wsB.id, name: 'Company Beta Inc' },
    });

    const leadB = await prisma.lead.create({
      data: {
        workspaceId: wsB.id,
        firstName: 'Bob',
        lastName: 'BetaLead',
        email: 'bob@beta.com',
        companyName: 'Company Beta Inc',
      },
    });

    const dealB = await prisma.deal.create({
      data: {
        workspaceId: wsB.id,
        title: 'Deal Beta',
        value: 50000,
        stage: 'DISCOVERY',
      },
    });

    const projectB = await prisma.project.create({
      data: {
        workspaceId: wsB.id,
        title: 'Project Beta',
        clientName: 'Company Beta Inc',
      },
    });

    // 3. Create legitimate resources in Workspace A
    const companyA = await prisma.company.create({
      data: { workspaceId: wsA.id, name: 'Company Alpha LLC' },
    });

    const leadA = await prisma.lead.create({
      data: {
        workspaceId: wsA.id,
        firstName: 'Alice',
        lastName: 'AlphaLead',
        email: 'alice@alpha.com',
        companyName: 'Company Alpha LLC',
      },
    });

    const dealA = await prisma.deal.create({
      data: {
        workspaceId: wsA.id,
        title: 'Deal Alpha',
        value: 75000,
        stage: 'DISCOVERY',
      },
    });

    const projectA = await prisma.project.create({
      data: {
        workspaceId: wsA.id,
        title: 'Project Alpha',
        clientName: 'Company Alpha LLC',
      },
    });

    // =========================================================================
    // SECTION 1: Foreign-Key Boundary Validation Tests
    // =========================================================================
    console.log('--- 1. Foreign-Key Boundary Validation ---');

    // 1. Workspace A can create task referencing Workspace A lead
    const validTaskRes = await fetch('http://localhost:3000/api/v1/tasks', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Valid Task A', leadId: leadA.id, assignedToId: repA.id }),
    });
    assert(validTaskRes.status === 201, 'Workspace A can create a task referencing Workspace A lead');

    // 2. Workspace A cannot create task referencing Workspace B lead
    const crossLeadTaskRes = await fetch('http://localhost:3000/api/v1/tasks', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cross Lead Task', leadId: leadB.id }),
    });
    assert(crossLeadTaskRes.status === 400, 'Workspace A cannot create a task referencing Workspace B lead');

    // 3. Workspace A cannot assign a task to Workspace B user
    const crossUserTaskRes = await fetch('http://localhost:3000/api/v1/tasks', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cross User Task', assignedToId: userB.id }),
    });
    assert(crossUserTaskRes.status === 400, 'Workspace A cannot assign a task to Workspace B user');

    // 4. Workspace A cannot create a task referencing Workspace B deal
    const crossDealTaskRes = await fetch('http://localhost:3000/api/v1/tasks', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cross Deal Task', dealId: dealB.id }),
    });
    assert(crossDealTaskRes.status === 400, 'Workspace A cannot create a task referencing Workspace B deal');

    // 5. Workspace A cannot create a deliverable for Workspace B project
    const crossProjDelivRes = await fetch('http://localhost:3000/api/v1/deliverables', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cross Project Deliverable', projectId: projectB.id }),
    });
    assert(crossProjDelivRes.status === 400, 'Workspace A cannot create a deliverable for Workspace B project');

    // 6. Workspace A cannot create an invoice for Workspace B company
    const crossCompInvRes = await fetch('http://localhost:3000/api/v1/invoices', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: '5000', companyId: companyB.id }),
    });
    assert(crossCompInvRes.status === 400, 'Workspace A cannot create an invoice for Workspace B company');

    // 7. Workspace A cannot create a proposal for Workspace B company
    const crossCompPropRes = await fetch('http://localhost:3000/api/v1/proposals', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cross Proposal', value: '10000', companyId: companyB.id }),
    });
    assert(crossCompPropRes.status === 400, 'Workspace A cannot create a proposal for Workspace B company');

    // 8. Workspace A cannot create a project for Workspace B company
    const crossCompProjRes = await fetch('http://localhost:3000/api/v1/projects', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cross Project', companyId: companyB.id }),
    });
    assert(crossCompProjRes.status === 400, 'Workspace A cannot create a project for Workspace B company');

    // 9. Workspace A cannot create an activity referencing Workspace B lead/deal
    const crossLeadActRes = await fetch('http://localhost:3000/api/v1/activities', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Cross Activity Lead', leadId: leadB.id }),
    });
    assert(crossLeadActRes.status === 400, 'Workspace A cannot create an activity referencing Workspace B lead');

    const crossDealActRes = await fetch('http://localhost:3000/api/v1/activities', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Cross Activity Deal', dealId: dealB.id }),
    });
    assert(crossDealActRes.status === 400, 'Workspace A cannot create an activity referencing Workspace B deal');

    // =========================================================================
    // SECTION 2: Role-Based Access Control (RBAC) Enforcement
    // =========================================================================
    console.log('\n--- 2. RBAC Enforcement on Financial & Administrative Operations ---');

    // Create an invoice for Workspace A
    const invoiceA = await prisma.invoice.create({
      data: {
        workspaceId: wsA.id,
        companyId: companyA.id,
        number: 'INV-TEST-001',
        client: 'Company Alpha LLC',
        amount: 15000,
        status: 'PENDING',
        issuedDate: new Date(),
        dueDate: new Date(),
      },
    });

    // Create a proposal for Workspace A
    const proposalA = await prisma.proposal.create({
      data: {
        workspaceId: wsA.id,
        companyId: companyA.id,
        title: 'Proposal Alpha Test',
        client: 'Company Alpha LLC',
        value: 20000,
        status: 'SENT',
      },
    });

    // 10. MEMBER cannot mark invoices PAID
    const memberInvoicePatch = await fetch('http://localhost:3000/api/v1/invoices', {
      method: 'PATCH',
      headers: { Cookie: cookieMemberA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoiceA.id, status: 'PAID' }),
    });
    assert(memberInvoicePatch.status === 403, 'MEMBER cannot mark invoices PAID (403 Forbidden)');

    // 11. SALES_REP cannot perform protected invoice mutations
    const repInvoicePatch = await fetch('http://localhost:3000/api/v1/invoices', {
      method: 'PATCH',
      headers: { Cookie: cookieRepA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoiceA.id, status: 'PAID' }),
    });
    assert(repInvoicePatch.status === 403, 'SALES_REP cannot perform protected invoice mutations (403 Forbidden)');

    const repInvoicePost = await fetch('http://localhost:3000/api/v1/invoices', {
      method: 'POST',
      headers: { Cookie: cookieRepA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: '8000', companyId: companyA.id }),
    });
    assert(repInvoicePost.status === 403, 'SALES_REP cannot create invoices (403 Forbidden)');

    // 12. MEMBER cannot delete protected proposals
    const memberProposalDelete = await fetch(`http://localhost:3000/api/v1/proposals?id=${proposalA.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieMemberA },
    });
    assert(memberProposalDelete.status === 403, 'MEMBER cannot delete protected proposals (403 Forbidden)');

    // 13. MEMBER cannot reset sample data
    const memberSampleReset = await fetch('http://localhost:3000/api/v1/workspace/sample-data', {
      method: 'DELETE',
      headers: { Cookie: cookieMemberA },
    });
    assert(memberSampleReset.status === 403, 'MEMBER cannot reset sample data (403 Forbidden)');

    // 14. SALES_REP cannot reset sample data
    const repSampleReset = await fetch('http://localhost:3000/api/v1/workspace/sample-data', {
      method: 'DELETE',
      headers: { Cookie: cookieRepA },
    });
    assert(repSampleReset.status === 403, 'SALES_REP cannot reset sample data (403 Forbidden)');

    // 15. ADMIN can perform allowed sample-data operations
    const adminSamplePost = await fetch('http://localhost:3000/api/v1/workspace/sample-data', {
      method: 'POST',
      headers: { Cookie: cookieAdminA },
    });
    assert(adminSamplePost.status === 200, 'ADMIN can perform allowed sample-data load operation');

    const adminSampleDelete = await fetch('http://localhost:3000/api/v1/workspace/sample-data', {
      method: 'DELETE',
      headers: { Cookie: cookieAdminA },
    });
    assert(adminSampleDelete.status === 200, 'ADMIN can perform allowed sample-data reset operation');

    // 16. OWNER and MANAGER can perform allowed protected operations
    const managerInvoicePatch = await fetch('http://localhost:3000/api/v1/invoices', {
      method: 'PATCH',
      headers: { Cookie: cookieManagerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoiceA.id, status: 'PAID' }),
    });
    assert(managerInvoicePatch.status === 200, 'MANAGER can mark invoices PAID');

    const ownerProposalDelete = await fetch(`http://localhost:3000/api/v1/proposals?id=${proposalA.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieOwnerA },
    });
    assert(ownerProposalDelete.status === 200, 'OWNER can delete proposals');

    // 17. Valid same-workspace operations continue to work
    const validDelivRes = await fetch('http://localhost:3000/api/v1/deliverables', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Deliverable Alpha', projectId: projectA.id }),
    });
    assert(validDelivRes.status === 201, 'Valid same-workspace deliverable creation succeeds');

    const validProjRes = await fetch('http://localhost:3000/api/v1/projects', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Project Alpha 2', companyId: companyA.id }),
    });
    assert(validProjRes.status === 201, 'Valid same-workspace project creation succeeds');

    const validActRes = await fetch('http://localhost:3000/api/v1/activities', {
      method: 'POST',
      headers: { Cookie: cookieOwnerA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Valid Activity Alpha', leadId: leadA.id, dealId: dealA.id }),
    });
    assert(validActRes.status === 201, 'Valid same-workspace activity creation succeeds');

    // 18. x-workspace-id cannot bypass any of these checks
    const spoofBypassRes = await fetch('http://localhost:3000/api/v1/tasks', {
      method: 'POST',
      headers: {
        Cookie: cookieOwnerA,
        'Content-Type': 'application/json',
        'x-workspace-id': wsB.id,
      },
      body: JSON.stringify({ title: 'Spoofed Header Task', leadId: leadB.id }),
    });
    assert(spoofBypassRes.status === 400, 'x-workspace-id cannot bypass foreign-key boundary checks');

    // Clean up test data
    console.log('\n--- Cleanup Test Fixtures ---');
    await prisma.session.deleteMany({
      where: { userId: { in: [ownerA.id, adminA.id, managerA.id, repA.id, memberA.id, userB.id] } },
    });
    await prisma.activity.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.fileRecord.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.proposal.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.invoice.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.deliverable.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.project.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.task.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.deal.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.contact.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.company.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerA.id, adminA.id, managerA.id, repA.id, memberA.id, userB.id] } },
    });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsA.id, wsB.id] } } });
    console.log('  Cleaned up all temporary test fixtures.');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n========================================');
  console.log(`Foreign-Key & RBAC Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNeedsReviewSecurityTests();
