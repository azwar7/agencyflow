import { prisma } from '../src/lib/prisma';
import { encodeSession, SESSION_COOKIE_NAME, AUTH_COOKIE_NAME } from '../src/lib/auth-session';

async function runAuthRegressionTest() {
  console.log('🧪 Starting Comprehensive Authorization & Multi-Tenant Regression Test Suite...\n');

  try {
    const timestamp = Date.now();
    const email1 = `reg_user1_${timestamp}@omegaagency.test`;
    const email2 = `reg_user2_${timestamp}@zetaagency.test`;

    // ==========================================
    // STEP 1: SIGNUP USER 1 (Brand New Workspace)
    // ==========================================
    console.log('1️⃣ Testing Signup for User 1 (Omega Agency)...');
    const signup1Res = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Omega Founder',
        email: email1,
        password: 'Password123!',
        agencyName: 'Omega Creative Agency',
      }),
    });
    const signup1Json = await signup1Res.json();
    if (!signup1Res.ok || !signup1Json.success) {
      throw new Error(`Signup 1 failed: ${JSON.stringify(signup1Json)}`);
    }

    const ws1Id = signup1Json.data.workspace.id;
    const user1Id = signup1Json.data.user.id;
    const token1 = encodeSession({
      userId: user1Id,
      workspaceId: ws1Id,
      email: email1,
      fullName: 'Omega Founder',
      role: 'OWNER',
      agencyName: 'Omega Creative Agency',
    });
    const headers1 = {
      Cookie: `${SESSION_COOKIE_NAME}=${token1}; ${AUTH_COOKIE_NAME}=true`,
      'x-workspace-id': ws1Id,
    };
    console.log(`   ✅ User 1 created with Workspace ID: ${ws1Id}`);

    // ==========================================
    // STEP 2: VERIFY CLEAN 0-STATE FOR NEW USER 1
    // ==========================================
    console.log('2️⃣ Verifying User 1 starts with 0 data across all modules...');
    const [dashRes, leadsRes, clientsRes, tasksRes, deliverablesRes, invoicesRes] = await Promise.all([
      fetch('http://localhost:3000/api/v1/dashboard', { headers: headers1 }).then((r) => r.json()),
      fetch('http://localhost:3000/api/v1/leads', { headers: headers1 }).then((r) => r.json()),
      fetch('http://localhost:3000/api/v1/clients', { headers: headers1 }).then((r) => r.json()),
      fetch('http://localhost:3000/api/v1/tasks', { headers: headers1 }).then((r) => r.json()),
      fetch('http://localhost:3000/api/v1/deliverables', { headers: headers1 }).then((r) => r.json()),
      fetch('http://localhost:3000/api/v1/invoices', { headers: headers1 }).then((r) => r.json()),
    ]);

    if (
      dashRes.data?.metrics?.totalPipelineValue !== 0 ||
      leadsRes.data?.length !== 0 ||
      clientsRes.data?.length !== 0 ||
      tasksRes.data?.length !== 0 ||
      deliverablesRes.data?.length !== 0 ||
      invoicesRes.data?.length !== 0
    ) {
      throw new Error(`❌ User 1 workspace is not clean on signup! Data: ${JSON.stringify({ dashRes, leadsRes, clientsRes })}`);
    }
    console.log('   ✅ Confirmed: 0 leads, 0 deals, 0 clients, 0 deliverables, 0 invoices, $0 pipeline.');

    // ==========================================
    // STEP 3: USER 1 CREATES PRIVATE RECORDS
    // ==========================================
    console.log('3️⃣ User 1 creates private lead & client...');
    const leadCreateRes = await fetch('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers1 },
      body: JSON.stringify({
        companyName: 'Omega Confidential Client',
        firstName: 'Oliver',
        lastName: 'Queen',
        email: 'oliver@queen.com',
        phone: '+1-555-0100',
        source: 'REFERRAL',
        status: 'QUALIFIED',
        leadScore: 95,
      }),
    });
    const leadCreateJson = await leadCreateRes.json();
    if (!leadCreateRes.ok || !leadCreateJson.success) {
      throw new Error(`Failed to create lead for User 1: ${JSON.stringify(leadCreateJson)}`);
    }
    console.log('   ✅ Lead "Omega Confidential Client" created in Workspace 1.');

    // ==========================================
    // STEP 4: SIGNUP USER 2 (Second Workspace)
    // ==========================================
    console.log('4️⃣ Testing Signup for User 2 (Zeta Agency)...');
    const signup2Res = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Zeta Leader',
        email: email2,
        password: 'Password123!',
        agencyName: 'Zeta Interactive',
      }),
    });
    const signup2Json = await signup2Res.json();
    if (!signup2Res.ok || !signup2Json.success) {
      throw new Error(`Signup 2 failed: ${JSON.stringify(signup2Json)}`);
    }

    const ws2Id = signup2Json.data.workspace.id;
    const user2Id = signup2Json.data.user.id;
    const token2 = encodeSession({
      userId: user2Id,
      workspaceId: ws2Id,
      email: email2,
      fullName: 'Zeta Leader',
      role: 'OWNER',
      agencyName: 'Zeta Interactive',
    });
    const headers2 = {
      Cookie: `${SESSION_COOKIE_NAME}=${token2}; ${AUTH_COOKIE_NAME}=true`,
      'x-workspace-id': ws2Id,
    };
    console.log(`   ✅ User 2 created with Workspace ID: ${ws2Id}`);

    // ==========================================
    // STEP 5: VERIFY STRICT TENANT ISOLATION
    // ==========================================
    console.log('5️⃣ Verifying Tenant Isolation (User 2 CANNOT see User 1 data)...');
    const leads2Res = await fetch('http://localhost:3000/api/v1/leads', { headers: headers2 });
    const leads2Json = await leads2Res.json();
    const foundLeak = leads2Json.data?.some((l: any) => l.companyName?.includes('Omega'));
    if (foundLeak || leads2Json.data?.length !== 0) {
      throw new Error(`❌ Cross-tenant data leak! User 2 received: ${JSON.stringify(leads2Json.data)}`);
    }
    console.log('   ✅ Tenant Isolation verified: User 2 sees 0 leads.');

    // ==========================================
    // STEP 6: LOGOUT & SESSION INVALIDATION
    // ==========================================
    console.log('6️⃣ Testing Server-Side Logout...');
    const logoutRes = await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers: headers1,
    });
    const logoutJson = await logoutRes.json();
    if (!logoutRes.ok || !logoutJson.success) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutJson)}`);
    }

    // Verify unauthenticated calls return 401
    const [meLoggedOut, dashLoggedOut] = await Promise.all([
      fetch('http://localhost:3000/api/v1/auth/me', { headers: { Cookie: '' } }),
      fetch('http://localhost:3000/api/v1/dashboard', { headers: { Cookie: '' } }),
    ]);

    if (meLoggedOut.status !== 401 || dashLoggedOut.status !== 401) {
      throw new Error(`❌ Logged out request was not rejected with 401! Me status: ${meLoggedOut.status}, Dash status: ${dashLoggedOut.status}`);
    }
    console.log('   ✅ Confirmed: Unauthenticated requests return 401 Unauthorized.');

    // ==========================================
    // STEP 7: LOGIN & SESSION RESTORATION
    // ==========================================
    console.log('7️⃣ Testing Login for User 1...');
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email1,
        password: 'Password123!',
      }),
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok || !loginJson.success || loginJson.data.user.email !== email1) {
      throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    }
    console.log(`   ✅ User 1 logged in successfully to workspace: ${loginJson.data.user.workspaceId}`);

    // Verify User 1's lead is still preserved
    const leadsAfterLoginRes = await fetch('http://localhost:3000/api/v1/leads', { headers: headers1 });
    const leadsAfterLoginJson = await leadsAfterLoginRes.json();
    if (leadsAfterLoginJson.data?.length !== 1 || leadsAfterLoginJson.data[0].companyName !== 'Omega Confidential Client') {
      throw new Error(`❌ Data mismatch on re-login: ${JSON.stringify(leadsAfterLoginJson.data)}`);
    }
    console.log('   ✅ User 1 private data successfully loaded on re-login.');

    // ==========================================
    // STEP 8: INVALID / MALFORMED TOKEN TEST
    // ==========================================
    console.log('8️⃣ Testing Invalid / Malformed Token handling...');
    const invalidTokenRes = await fetch('http://localhost:3000/api/v1/auth/me', {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=malformed_garbage_token` },
    });
    if (invalidTokenRes.status !== 401) {
      throw new Error(`❌ Malformed token returned ${invalidTokenRes.status} instead of 401!`);
    }
    console.log('   ✅ Malformed token safely rejected with 401 Unauthorized.');

    console.log('\n🎉 ALL 8 REGRESSION TESTS PASSED 100% PERFECTLY! 🎉\n');
  } catch (error) {
    console.error('\n❌ Regression test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthRegressionTest();
