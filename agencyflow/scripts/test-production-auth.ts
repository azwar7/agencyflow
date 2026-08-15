import { prisma } from '../src/lib/prisma';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { createSession, getAuthSession, deleteSession, hashToken, SESSION_COOKIE_NAME } from '../src/lib/auth-session';
import { requireAuth, requireRole, hasMinimumRole, requireWorkspaceOwnership } from '../src/lib/authorization';

async function runTests() {
  console.log('🚀 Starting Production-Grade Authentication & Authorization Test Suite...\n');
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
    // -------------------------------------------------------------
    // TEST SUITE 1: Real Password Hashing (bcrypt)
    // -------------------------------------------------------------
    console.log('--- TEST SUITE 1: Real Password Hashing ---');
    const plaintext = 'SuperSecret2026!';
    const hashed = await hashPassword(plaintext);

    assert(hashed.startsWith('$2a$') || hashed.startsWith('$2b$'), 'Password hash uses standard bcrypt format');
    assert(hashed !== plaintext, 'Password is not plaintext');
    assert(!hashed.includes(Buffer.from(plaintext).toString('base64')), 'Password is not base64 encoded');

    const validMatch = await verifyPassword(plaintext, hashed);
    assert(validMatch === true, 'Correct password verifies successfully');

    const invalidMatch = await verifyPassword('WrongPassword123', hashed);
    assert(invalidMatch === false, 'Incorrect password is rejected');

    const emptyMatch = await verifyPassword('', hashed);
    assert(emptyMatch === false, 'Empty password is rejected');

    // -------------------------------------------------------------
    // TEST SUITE 2: Workspace & User Provisioning
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Workspace & User Provisioning ---');
    const testAgencyA = `Test Agency Alpha ${Date.now()}`;
    const testEmailA = `owner.alpha.${Date.now()}@testagency.io`;

    const wsA = await prisma.workspace.create({
      data: {
        name: testAgencyA,
        slug: `alpha-${Date.now()}`,
      },
    });

    const userA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: testEmailA,
        fullName: 'Alice Alpha',
        role: 'OWNER',
        passwordHash: await hashPassword('AlphaPass123!'),
      },
    });

    assert(Boolean(userA.id && wsA.id), 'Workspace and OWNER user created successfully');
    assert(userA.role === 'OWNER', 'User created with OWNER role');

    // -------------------------------------------------------------
    // TEST SUITE 3: Database Session Creation & Token Hashing (Exact Unmodified Hash)
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: Database Sessions & Exact Token Hashing ---');
    const { rawToken, expiresAt } = await createSession(userA.id);

    assert(typeof rawToken === 'string' && rawToken.length >= 32, 'Cryptographically secure raw token generated');
    assert(expiresAt > new Date(), 'Session expires in future (7 days)');

    const expectedHash = hashToken(rawToken);
    const dbSession = await prisma.session.findUnique({
      where: { tokenHash: expectedHash },
    });

    assert(Boolean(dbSession), 'Session stored in database indexed by SHA-256 tokenHash');
    assert(dbSession?.userId === userA.id, 'Session correctly linked to User A');

    // Verify raw token is NOT in the database
    const rawMatch = await prisma.session.findFirst({
      where: { tokenHash: rawToken },
    });
    assert(rawMatch === null, 'Raw session token is NEVER stored in database');

    // Verify hashToken hashes exact string without trimming
    const untrimmedToken = '  tokenWithSpaces  ';
    const trimmedToken = 'tokenWithSpaces';
    assert(hashToken(untrimmedToken) !== hashToken(trimmedToken), 'hashToken hashes exact token without trimming');

    // -------------------------------------------------------------
    // TEST SUITE 4: Session Resolution (getAuthSession)
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Session Resolution (Zero Trust) ---');
    const mockRequestWithCookie = new Request('http://localhost:3000/api/v1/dashboard', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${rawToken}`,
      },
    });

    const sessionA = await getAuthSession(mockRequestWithCookie);
    assert(sessionA.userId === userA.id, 'getAuthSession resolves correct user from cookie');
    assert(sessionA.workspaceId === wsA.id, 'getAuthSession derives workspace from User record');
    assert(sessionA.role === 'OWNER', 'getAuthSession returns correct role from database');

    // Test forged / random token
    let forgedFailed = false;
    try {
      const mockForgedRequest = new Request('http://localhost:3000/api/v1/dashboard', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=forged_random_token_xyz_123`,
        },
      });
      await getAuthSession(mockForgedRequest);
    } catch {
      forgedFailed = true;
    }
    assert(forgedFailed, 'Forged session token throws 401 Unauthorized');

    // Test header spoofing attempt (x-workspace-id without valid session)
    let headerSpoofFailed = false;
    try {
      const mockHeaderSpoofRequest = new Request('http://localhost:3000/api/v1/dashboard', {
        headers: {
          'x-workspace-id': wsA.id,
        },
      });
      await getAuthSession(mockHeaderSpoofRequest);
    } catch {
      headerSpoofFailed = true;
    }
    assert(headerSpoofFailed, 'x-workspace-id header alone CANNOT authenticate (Spoofing prevented)');

    // -------------------------------------------------------------
    // TEST SUITE 5: Session Invalidation (Logout)
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Server-Side Logout ---');
    await deleteSession(mockRequestWithCookie);

    const deletedCheck = await prisma.session.findUnique({
      where: { tokenHash: expectedHash },
    });
    assert(deletedCheck === null, 'deleteSession completely purges session from database');

    let postLogoutAuthFailed = false;
    try {
      await getAuthSession(mockRequestWithCookie);
    } catch {
      postLogoutAuthFailed = true;
    }
    assert(postLogoutAuthFailed, 'Logged out session cookie cannot be reused for API requests');

    // -------------------------------------------------------------
    // TEST SUITE 6: Multi-Tenant Data Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 6: Multi-Tenant Data Isolation ---');
    // Create Workspace B and User B
    const wsB = await prisma.workspace.create({
      data: {
        name: `Test Agency Beta ${Date.now()}`,
        slug: `beta-${Date.now()}`,
      },
    });

    const userB = await prisma.user.create({
      data: {
        workspaceId: wsB.id,
        email: `owner.beta.${Date.now()}@testagency.io`,
        fullName: 'Bob Beta',
        role: 'OWNER',
        passwordHash: await hashPassword('BetaPass123!'),
      },
    });

    // Create a private deal in Workspace A
    const dealA = await prisma.deal.create({
      data: {
        workspaceId: wsA.id,
        title: 'Confidential Enterprise Deal for Workspace A',
        value: 120000,
        stage: 'CLOSED_WON',
      },
    });

    // Create session for User B
    const { rawToken: tokenB } = await createSession(userB.id);
    const reqB = new Request('http://localhost:3000/api/v1/projects', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${tokenB}` },
    });
    const sessionB = await getAuthSession(reqB);

    // User B attempts to query Deal A
    const crossTenantDeal = await prisma.deal.findFirst({
      where: {
        id: dealA.id,
        workspaceId: sessionB.workspaceId,
      },
    });
    assert(crossTenantDeal === null, 'Tenant B query cannot access Tenant A deal (Tenant isolation enforced)');

    let ownershipCheckPassed = false;
    try {
      requireWorkspaceOwnership(crossTenantDeal, sessionB, 'Deal');
    } catch (e: any) {
      ownershipCheckPassed = e.message.includes('not found');
    }
    assert(ownershipCheckPassed, 'requireWorkspaceOwnership rejects cross-tenant access with 404');

    // -------------------------------------------------------------
    // TEST SUITE 7: Server-Side RBAC & Fail-Closed Hierarchy
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 7: Server-Side RBAC & Fail-Closed Hierarchy ---');
    // Create Sales Rep in Workspace A
    const repUserA = await prisma.user.create({
      data: {
        workspaceId: wsA.id,
        email: `rep.alpha.${Date.now()}@testagency.io`,
        fullName: 'Rachel Rep',
        role: 'SALES_REP',
        passwordHash: await hashPassword('RepPass123!'),
      },
    });

    const { rawToken: repToken } = await createSession(repUserA.id);
    const repReq = new Request('http://localhost:3000/api/v1/team', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${repToken}` },
    });
    const repSession = await getAuthSession(repReq);

    let roleCheckForbidden = false;
    try {
      requireRole(repSession, ['OWNER', 'ADMIN']);
    } catch (e: any) {
      roleCheckForbidden = e.message.startsWith('Forbidden:');
    }
    assert(roleCheckForbidden, 'requireRole throws Forbidden (403 pattern) for SALES_REP on OWNER operations');

    let missingSessionUnauthorized = false;
    try {
      requireRole(null as any, ['OWNER']);
    } catch (e: any) {
      missingSessionUnauthorized = e.message.startsWith('Unauthorized:');
    }
    assert(missingSessionUnauthorized, 'requireRole throws Unauthorized (401 pattern) when session is missing');

    // Test hasMinimumRole fail-closed behavior
    assert(hasMinimumRole('OWNER', 'ADMIN') === true, 'hasMinimumRole: OWNER >= ADMIN is true');
    assert(hasMinimumRole('ADMIN', 'OWNER') === false, 'hasMinimumRole: ADMIN >= OWNER is false');
    assert(hasMinimumRole('SALES_REP', 'MANAGER') === false, 'hasMinimumRole: SALES_REP >= MANAGER is false');
    assert(hasMinimumRole('MANAGER', 'SALES_REP') === true, 'hasMinimumRole: MANAGER >= SALES_REP is true');

    // Unknown / invalid role testing (FAIL-CLOSED)
    assert(hasMinimumRole('SUPERADMIN', 'ADMIN') === false, 'hasMinimumRole fails closed on unknown user role');
    assert(hasMinimumRole('OWNER', 'SUPER_ROOT') === false, 'hasMinimumRole fails closed on unknown required role');
    assert(hasMinimumRole('INVALID', 'INVALID') === false, 'hasMinimumRole fails closed when both roles are unknown');
    assert(hasMinimumRole('', 'ADMIN') === false, 'hasMinimumRole fails closed on empty string user role');
    assert(hasMinimumRole('OWNER', '') === false, 'hasMinimumRole fails closed on empty string required role');

    // Create Owner session for Workspace A
    const { rawToken: newOwnerToken } = await createSession(userA.id);
    const ownerReq = new Request('http://localhost:3000/api/v1/team', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${newOwnerToken}` },
    });
    const ownerSession = await getAuthSession(ownerReq);

    let ownerAllowed = true;
    try {
      requireRole(ownerSession, ['OWNER', 'ADMIN']);
    } catch {
      ownerAllowed = false;
    }
    assert(ownerAllowed, 'OWNER is authorized for administrative team operations');

    // Clean up test data
    console.log('\n--- Cleanup Test Records ---');
    await prisma.session.deleteMany({ where: { userId: { in: [userA.id, userB.id, repUserA.id] } } });
    await prisma.deal.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, repUserA.id] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsA.id, wsB.id] } } });
    console.log('  Cleaned up all temporary test fixtures.');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n========================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
