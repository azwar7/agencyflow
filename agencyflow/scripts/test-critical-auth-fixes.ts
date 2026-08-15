import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

async function runSecurityAuditFixTests() {
  console.log('🛡️  Running Security Verification for Critical & High-Risk Endpoints...\n');
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

    // 1. Create Workspace A and User A
    const wsA = await prisma.workspace.create({
      data: { name: `Security Test Agency A ${timestamp}`, slug: `sec-a-${timestamp}` },
    });
    const userA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: `alice_${timestamp}@sec-a.io`,
        fullName: 'Alice Security',
        role: 'OWNER',
        passwordHash: await hashPassword('SecretPass123!'),
      },
    });
    const { rawToken: tokenA } = await createSession(userA.id);
    const cookieA = `${SESSION_COOKIE_NAME}=${tokenA}`;

    // 2. Create Workspace B and User B
    const wsB = await prisma.workspace.create({
      data: { name: `Security Test Agency B ${timestamp}`, slug: `sec-b-${timestamp}` },
    });
    const userB = await prisma.user.create({
      data: {
        workspaceId: wsB.id,
        email: `bob_${timestamp}@sec-b.io`,
        fullName: 'Bob Attacker',
        role: 'OWNER',
        passwordHash: await hashPassword('SecretPass123!'),
      },
    });
    const { rawToken: tokenB } = await createSession(userB.id);
    const cookieB = `${SESSION_COOKIE_NAME}=${tokenB}`;

    // 3. Create private Lead and Deal in Workspace A
    const leadA = await prisma.lead.create({
      data: {
        workspaceId: wsA.id,
        assignedToId: userA.id,
        firstName: 'Confidential',
        lastName: 'Prospect',
        email: 'confidential@alpha-client.com',
        companyName: 'Alpha Secret Holdings',
        source: 'Executive Referral',
        leadScore: 70,
      },
    });

    const dealA = await prisma.deal.create({
      data: {
        workspaceId: wsA.id,
        assignedToId: userA.id,
        title: 'Confidential Strategy Deal A',
        value: 150000,
        stage: 'DISCOVERY',
      },
    });

    // =========================================================================
    // TEST 1: Unauthenticated Requests Rejected Across All Fixed Endpoints
    // =========================================================================
    console.log('--- 1. Unauthenticated Requests Rejected (401/404) ---');

    // POST /api/v1/seed
    const unauthSeed = await fetch('http://localhost:3000/api/v1/seed', { method: 'POST' });
    assert(unauthSeed.status === 401 || unauthSeed.status === 404, 'POST /api/v1/seed rejects unauthenticated caller');

    // GET /api/v1/leads/[id]
    const unauthLeadGet = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}`);
    assert(unauthLeadGet.status === 401, 'GET /api/v1/leads/[id] rejects unauthenticated caller with 401');

    // PATCH /api/v1/leads/[id]
    const unauthLeadPatch = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadScore: 99 }),
    });
    assert(unauthLeadPatch.status === 401, 'PATCH /api/v1/leads/[id] rejects unauthenticated caller with 401');

    // POST /api/v1/leads/[id]/convert
    const unauthConvert = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealTitle: 'Malicious Conversion' }),
    });
    assert(unauthConvert.status === 401, 'POST /api/v1/leads/[id]/convert rejects unauthenticated caller with 401');

    // PATCH /api/v1/deals/[id]/stage
    const unauthDealStage = await fetch(`http://localhost:3000/api/v1/deals/${dealA.id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'CLOSED_LOST' }),
    });
    assert(unauthDealStage.status === 401, 'PATCH /api/v1/deals/[id]/stage rejects unauthenticated caller with 401');

    // POST /api/v1/ai/score-lead
    const unauthScore = await fetch('http://localhost:3000/api/v1/ai/score-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: leadA.id }),
    });
    assert(unauthScore.status === 401, 'POST /api/v1/ai/score-lead rejects unauthenticated caller with 401');

    // POST /api/v1/ai/generate-followup
    const unauthFollowup = await fetch('http://localhost:3000/api/v1/ai/generate-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: leadA.id }),
    });
    assert(unauthFollowup.status === 401, 'POST /api/v1/ai/generate-followup rejects unauthenticated caller with 401');

    // =========================================================================
    // TEST 2: Cross-Tenant Isolation (User B cannot access or modify User A data)
    // =========================================================================
    console.log('\n--- 2. Cross-Tenant Isolation & IDOR/BOLA Protection ---');

    // User B tries to GET Lead A
    const bGetLeadA = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}`, {
      headers: { Cookie: cookieB },
    });
    assert(bGetLeadA.status === 404, 'User B GET Lead A returns 404 Not Found (IDOR blocked)');

    // User B tries to PATCH Lead A
    const bPatchLeadA = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadScore: 10, status: 'UNQUALIFIED' }),
    });
    assert(bPatchLeadA.status === 404, 'User B PATCH Lead A returns 404 Not Found (Mutation blocked)');

    // User B tries to Convert Lead A
    const bConvertLeadA = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}/convert`, {
      method: 'POST',
      headers: { Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealTitle: 'Hacked Deal' }),
    });
    assert(bConvertLeadA.status === 404, 'User B POST Lead A conversion returns 404 Not Found (BOLA blocked)');

    // User B tries to change stage on Deal A
    const bStageDealA = await fetch(`http://localhost:3000/api/v1/deals/${dealA.id}/stage`, {
      method: 'PATCH',
      headers: { Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'CLOSED_LOST', lossReason: 'Competitor' }),
    });
    assert(bStageDealA.status === 404, 'User B PATCH Deal A stage returns 404 Not Found (Deal tampering blocked)');

    // User B tries to score Lead A with AI
    const bScoreLeadA = await fetch('http://localhost:3000/api/v1/ai/score-lead', {
      method: 'POST',
      headers: { Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: leadA.id }),
    });
    assert(bScoreLeadA.status === 404, 'User B POST AI score Lead A returns 404 Not Found');

    // User B tries to generate AI followup for Lead A
    const bFollowupLeadA = await fetch('http://localhost:3000/api/v1/ai/generate-followup', {
      method: 'POST',
      headers: { Cookie: cookieB, 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: leadA.id }),
    });
    assert(bFollowupLeadA.status === 404, 'User B POST AI followup Lead A returns 404 Not Found (Data leak blocked)');

    // User B attempts to spoof x-workspace-id header to access Lead A
    const bSpoofGetLeadA = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}`, {
      headers: {
        Cookie: cookieB,
        'x-workspace-id': wsA.id,
      },
    });
    assert(bSpoofGetLeadA.status === 404, 'x-workspace-id header CANNOT bypass tenant isolation');

    // =========================================================================
    // TEST 3: Legitimate Access & Operations for Workspace A User
    // =========================================================================
    console.log('\n--- 3. Legitimate Authenticated Functionality ---');

    // User A GET Lead A
    const aGetLeadA = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}`, {
      headers: { Cookie: cookieA },
    });
    const aGetJson = await aGetLeadA.json();
    assert(aGetLeadA.status === 200 && aGetJson.success && aGetJson.data.email === leadA.email, 'User A can GET own Lead');

    // User A PATCH Lead A
    const aPatchLeadA = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadScore: 85, status: 'QUALIFIED' }),
    });
    const aPatchJson = await aPatchLeadA.json();
    assert(aPatchLeadA.status === 200 && aPatchJson.success && aPatchJson.data.leadScore === 85, 'User A can PATCH own Lead');

    // User A AI Score Lead A
    const aScoreLeadA = await fetch('http://localhost:3000/api/v1/ai/score-lead', {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: leadA.id }),
    });
    const aScoreJson = await aScoreLeadA.json();
    assert(aScoreLeadA.status === 200 && aScoreJson.success && typeof aScoreJson.data.score === 'number', 'User A can AI Score own Lead');

    // User A AI Generate Followup for Lead A
    const aFollowupLeadA = await fetch('http://localhost:3000/api/v1/ai/generate-followup', {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: leadA.id, tone: 'executive' }),
    });
    const aFollowupJson = await aFollowupLeadA.json();
    assert(
      aFollowupLeadA.status === 200 && aFollowupJson.success && aFollowupJson.data.subject.includes(leadA.companyName!),
      'User A can AI Generate Followup for own Lead'
    );

    // User A PATCH Deal A stage
    const aStageDealA = await fetch(`http://localhost:3000/api/v1/deals/${dealA.id}/stage`, {
      method: 'PATCH',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'PROPOSAL' }),
    });
    const aStageJson = await aStageDealA.json();
    assert(aStageDealA.status === 200 && aStageJson.success && aStageJson.data.stage === 'PROPOSAL', 'User A can update own Deal stage');

    // Verify activity actor was recorded as userA.id (not random user from DB)
    const stageActivity = await prisma.activity.findFirst({
      where: { dealId: dealA.id, type: 'STAGE_CHANGE' },
      orderBy: { createdAt: 'desc' },
    });
    assert(stageActivity?.userId === userA.id, 'Activity author is correctly recorded as session.userId');

    // User A Converts Lead A
    const aConvertLeadA = await fetch(`http://localhost:3000/api/v1/leads/${leadA.id}/convert`, {
      method: 'POST',
      headers: { Cookie: cookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealTitle: 'Converted Alpha Project Deal', dealValue: 75000 }),
    });
    const aConvertJson = await aConvertLeadA.json();
    assert(aConvertLeadA.status === 200 && aConvertJson.success, 'User A can convert own Lead into Deal');

    // Verify converted deal and company belong strictly to Workspace A
    const convertedDeal = await prisma.deal.findFirst({
      where: { title: 'Converted Alpha Project Deal' },
    });
    assert(convertedDeal?.workspaceId === wsA.id, 'Converted deal belongs strictly to Workspace A');

    // Clean up test fixtures
    console.log('\n--- Cleanup Test Fixtures ---');
    await prisma.session.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.activity.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.contact.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.deal.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.company.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsA.id, wsB.id] } } });
    console.log('  Cleaned up all temporary test fixtures.');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n========================================');
  console.log(`Security Audit Fix Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditFixTests();
