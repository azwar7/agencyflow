import { prisma } from '../src/lib/prisma';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { createSession, hashToken, setSessionCookie } from '../src/lib/auth-session';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🛡️  Starting Phase 2 Security Remediation Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // --- Fixture Setup ---
  const wsA = await prisma.workspace.create({
    data: { name: 'Phase2 Alpha Agency', slug: `p2-alpha-${Date.now()}` },
  });
  const wsB = await prisma.workspace.create({
    data: { name: 'Phase2 Beta Agency', slug: `p2-beta-${Date.now()}` },
  });

  const ownerA = await prisma.user.create({
    data: {
      workspaceId: wsA.id,
      email: `owner.alpha.${Date.now()}@test.com`,
      fullName: 'Alpha Owner',
      role: 'OWNER',
      passwordHash: await hashPassword('OwnerPass123!'),
    },
  });

  const adminA = await prisma.user.create({
    data: {
      workspaceId: wsA.id,
      email: `admin.alpha.${Date.now()}@test.com`,
      fullName: 'Alpha Admin',
      role: 'ADMIN',
      passwordHash: await hashPassword('AdminPass123!'),
    },
  });

  const repA = await prisma.user.create({
    data: {
      workspaceId: wsA.id,
      email: `rep.alpha.${Date.now()}@test.com`,
      fullName: 'Alpha Rep',
      role: 'SALES_REP',
      passwordHash: await hashPassword('RepPass123!'),
    },
  });

  const userB = await prisma.user.create({
    data: {
      workspaceId: wsB.id,
      email: `owner.beta.${Date.now()}@test.com`,
      fullName: 'Beta Owner',
      role: 'OWNER',
      passwordHash: await hashPassword('BetaPass123!'),
    },
  });

  const sessionOwnerA = await createSession(ownerA.id);
  const sessionAdminA = await createSession(adminA.id);
  const sessionRepA = await createSession(repA.id);
  const sessionUserB = await createSession(userB.id);

  const ownerCookie = `agencyflow_session=${sessionOwnerA.rawToken}`;
  const adminCookie = `agencyflow_session=${sessionAdminA.rawToken}`;
  const repCookie = `agencyflow_session=${sessionRepA.rawToken}`;
  const userBCookie = `agencyflow_session=${sessionUserB.rawToken}`;

  console.log('--- 1. Team Invitation Security & Anti-Escalation RBAC ---');

  // Test 1: OWNER can invite an ADMIN
  const inviteAdminRes = await fetch(`${BASE_URL}/api/v1/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({
      email: `invited.admin.${Date.now()}@test.com`,
      role: 'ADMIN',
    }),
  });
  const inviteAdminJson = await inviteAdminRes.json();
  assert(inviteAdminRes.status === 201 && inviteAdminJson.success, 'OWNER can invite an ADMIN');
  const adminInviteToken = inviteAdminJson.data?.inviteToken;
  assert(typeof adminInviteToken === 'string' && adminInviteToken.length > 20, 'Cryptographic invite token returned to inviter');

  // Verify raw token is NOT in database
  const storedInvite = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(adminInviteToken) },
  });
  assert(Boolean(storedInvite), 'Invitation record found in database by SHA-256 tokenHash');
  const rawCheck = await prisma.invitation.findFirst({
    where: { tokenHash: adminInviteToken },
  });
  assert(!rawCheck, 'Raw invitation token is NEVER stored in database (only SHA-256)');

  // Test 2: ADMIN cannot invite an OWNER (Anti-Escalation)
  const adminEscalateOwnerRes = await fetch(`${BASE_URL}/api/v1/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      email: `escalate.owner.${Date.now()}@test.com`,
      role: 'OWNER',
    }),
  });
  assert(adminEscalateOwnerRes.status === 403, 'ADMIN cannot invite an OWNER (403 Forbidden)');

  // Test 3: ADMIN cannot invite another ADMIN (Anti-Escalation)
  const adminEscalateAdminRes = await fetch(`${BASE_URL}/api/v1/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      email: `escalate.admin.${Date.now()}@test.com`,
      role: 'ADMIN',
    }),
  });
  assert(adminEscalateAdminRes.status === 403, 'ADMIN cannot invite another ADMIN (403 Forbidden)');

  // Test 4: ADMIN can invite a MANAGER
  const adminInviteManagerRes = await fetch(`${BASE_URL}/api/v1/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      email: `invited.manager.${Date.now()}@test.com`,
      role: 'MANAGER',
    }),
  });
  assert(adminInviteManagerRes.status === 201, 'ADMIN can invite a MANAGER');

  // Test 5: SALES_REP cannot invite team members
  const repInviteRes = await fetch(`${BASE_URL}/api/v1/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: repCookie },
    body: JSON.stringify({
      email: `rep.invite.${Date.now()}@test.com`,
      role: 'SALES_REP',
    }),
  });
  assert(repInviteRes.status === 403, 'SALES_REP cannot invite team members (403 Forbidden)');

  // Test 6: Invalid role is rejected
  const invalidRoleRes = await fetch(`${BASE_URL}/api/v1/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({
      email: `invalid.role.${Date.now()}@test.com`,
      role: 'SUPERUSER_ROOT',
    }),
  });
  assert(invalidRoleRes.status === 400, 'Unrecognized role string is rejected (400 Bad Request)');

  console.log('\n--- 2. Secure Invitation Acceptance Flow ---');

  // Test 7: User establishes chosen password on invite acceptance
  const chosenPassword = 'MySecretChosenPass2026!';
  const acceptRes = await fetch(`${BASE_URL}/api/v1/team/accept-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: adminInviteToken,
      fullName: 'Newly Accepted Admin',
      password: chosenPassword,
    }),
  });
  const acceptJson = await acceptRes.json();
  assert(acceptRes.status === 200 && acceptJson.success, 'Invited user successfully accepts invitation with own password');

  // Test 8: Newly accepted user can authenticate with chosen password
  const newEmail = storedInvite!.email;
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newEmail,
      password: chosenPassword,
    }),
  });
  const loginJson = await loginRes.json();
  assert(loginRes.status === 200 && loginJson.success, 'Accepted user can log in with chosen password');

  // Test 9: Replay / Reuse of consumed token is rejected
  const replayAcceptRes = await fetch(`${BASE_URL}/api/v1/team/accept-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: adminInviteToken,
      fullName: 'Attacker Replay',
      password: 'AttackerPass123!',
    }),
  });
  assert(replayAcceptRes.status === 400, 'Re-use of already accepted invitation token is rejected (Single-use)');

  // Test 10: Forged / Nonexistent token is rejected
  const forgedAcceptRes = await fetch(`${BASE_URL}/api/v1/team/accept-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: 'forged_fake_token_that_does_not_exist_in_db',
      fullName: 'Attacker',
      password: 'AttackerPass123!',
    }),
  });
  assert(forgedAcceptRes.status === 400, 'Forged / invalid invitation token is rejected');

  // Test 11: Expired invitation token is rejected
  const expiredRawToken = crypto.randomBytes(32).toString('base64url');
  await prisma.invitation.create({
    data: {
      workspaceId: wsA.id,
      invitedById: ownerA.id,
      email: `expired.${Date.now()}@test.com`,
      role: 'SALES_REP',
      tokenHash: hashToken(expiredRawToken),
      expiresAt: new Date(Date.now() - 1000 * 60), // expired 1 minute ago
    },
  });
  const expiredAcceptRes = await fetch(`${BASE_URL}/api/v1/team/accept-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: expiredRawToken,
      fullName: 'Late User',
      password: 'LateUserPass123!',
    }),
  });
  assert(expiredAcceptRes.status === 400, 'Expired invitation token is rejected');

  console.log('\n--- 3. Duplicate Lead Conversion & Concurrency Protection ---');

  // Create a fresh test lead
  const testLead = await prisma.lead.create({
    data: {
      workspaceId: wsA.id,
      firstName: 'Samantha',
      lastName: 'Miller',
      email: `samantha.${Date.now()}@growthcorp.com`,
      companyName: 'GrowthCorp Digital',
      status: 'NEW',
    },
  });

  // Test 12: First lead conversion succeeds
  const firstConvertRes = await fetch(`${BASE_URL}/api/v1/leads/${testLead.id}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({ dealTitle: 'GrowthCorp Custom Engine', dealValue: 45000 }),
  });
  const firstConvertJson = await firstConvertRes.json();
  assert(firstConvertRes.status === 200 && firstConvertJson.success, 'First lead conversion succeeds');

  // Test 13: Second lead conversion on same lead is rejected
  const secondConvertRes = await fetch(`${BASE_URL}/api/v1/leads/${testLead.id}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({ dealTitle: 'Duplicate Deal', dealValue: 45000 }),
  });
  assert(secondConvertRes.status === 400, 'Duplicate lead conversion on already CONVERTED lead is rejected');

  // Test 14: Concurrent rapid lead conversions produce exactly ONE conversion
  const concurrentLead = await prisma.lead.create({
    data: {
      workspaceId: wsA.id,
      firstName: 'Concurrent',
      lastName: 'Target',
      email: `concurrent.${Date.now()}@target.com`,
      companyName: 'Concurrent Corp',
      status: 'NEW',
    },
  });

  const concurrentPromises = [1, 2, 3, 4, 5].map(() =>
    fetch(`${BASE_URL}/api/v1/leads/${concurrentLead.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({ dealTitle: 'Concurrent Race Deal', dealValue: 30000 }),
    }).then((r) => r.status)
  );

  const statuses = await Promise.all(concurrentPromises);
  const successCount = statuses.filter((s) => s === 200).length;
  const failureCount = statuses.filter((s) => s === 400).length;
  assert(successCount === 1, `Rapid concurrent conversions resulted in exactly 1 success (actual: ${successCount})`);
  assert(failureCount === 4, `Remaining concurrent attempts were safely rejected (actual: ${failureCount})`);

  // Verify database has exactly 1 deal for this company
  const createdDeals = await prisma.deal.findMany({
    where: { workspaceId: wsA.id, title: 'Concurrent Race Deal' },
  });
  assert(createdDeals.length === 1, 'Exactly one Deal record created in database under concurrent race');

  // Test 15: Cross-workspace lead conversion is blocked
  const crossWsConvertRes = await fetch(`${BASE_URL}/api/v1/leads/${concurrentLead.id}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userBCookie },
    body: JSON.stringify({ dealTitle: 'Cross Tenant Deal' }),
  });
  assert(crossWsConvertRes.status === 404, 'Cross-workspace lead conversion is blocked (404 Not Found)');

  console.log('\n--- 4. Zod Input Validation & Numeric Range Hardening ---');

  // Test 16: Deal creation with negative value rejected
  const negDealRes = await fetch(`${BASE_URL}/api/v1/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({ title: 'Negative Deal', value: -5000 }),
  });
  assert(negDealRes.status === 400, 'Deal creation with negative value is rejected (400 Bad Request)');

  // Test 17: Invoice creation with negative amount rejected
  const negInvoiceRes = await fetch(`${BASE_URL}/api/v1/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({ client: 'Test Client', amount: -2500 }),
  });
  assert(negInvoiceRes.status === 400, 'Invoice creation with negative amount is rejected (400 Bad Request)');

  // Test 18: Project creation with negative budget rejected
  const negProjectRes = await fetch(`${BASE_URL}/api/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({ title: 'Negative Project', budget: -10000 }),
  });
  assert(negProjectRes.status === 400, 'Project creation with negative budget is rejected (400 Bad Request)');

  // Test 19: Proposal creation with negative value rejected
  const negProposalRes = await fetch(`${BASE_URL}/api/v1/proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({ title: 'Negative Proposal', value: -15000 }),
  });
  assert(negProposalRes.status === 400, 'Proposal creation with negative value is rejected (400 Bad Request)');

  // Test 20: Valid deal with non-negative value succeeds
  const validDealRes = await fetch(`${BASE_URL}/api/v1/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
    body: JSON.stringify({ title: 'Valid Agency Deal', value: 35000 }),
  });
  assert(validDealRes.status === 201, 'Valid deal with non-negative value succeeds (201 Created)');

  console.log('\n--- 5. Rate Limiting ---');

  // Test 21: High-frequency requests trigger rate limiting (429)
  // Let's test the rate limiter logic directly and via route
  const testIp = `rate-limit-test-ip-${Date.now()}`;
  let hit429 = false;
  let retryAfterHeader = null;

  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp,
      },
      body: JSON.stringify({ email: 'nonexistent@test.com', password: 'wrong' }),
    });

    if (res.status === 429) {
      hit429 = true;
      retryAfterHeader = res.headers.get('Retry-After');
      break;
    }
  }
  assert(hit429, 'Repeated login attempts trigger 429 Too Many Requests');
  assert(Boolean(retryAfterHeader), `429 response includes Retry-After header (${retryAfterHeader}s)`);

  console.log('\n--- Cleanup Test Fixtures ---');
  await prisma.workspace.deleteMany({
    where: { id: { in: [wsA.id, wsB.id] } },
  });
  console.log('  Cleaned up all test workspaces and records.');

  console.log('\n========================================');
  console.log(`Phase 2 Remediation Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
