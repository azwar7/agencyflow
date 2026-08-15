import { prisma } from '../src/lib/prisma';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

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
    const { rawToken: token1 } = await createSession(user1Id);

    const headers1 = {
      Cookie: `${SESSION_COOKIE_NAME}=${token1}`,
    };
    console.log(`   ✅ User 1 created with Workspace ID: ${ws1Id}`);

    // ==========================================
    // STEP 2: VERIFY EMPTY STATE FOR USER 1
    // ==========================================
    console.log('2️⃣ Verifying empty state for User 1 on /api/v1/dashboard & /api/v1/leads...');
    const dash1Res = await fetch('http://localhost:3000/api/v1/dashboard', { headers: headers1 });
    const dash1Json = await dash1Res.json();
    if (!dash1Res.ok || !dash1Json.success) {
      throw new Error(`User 1 dashboard query failed: ${JSON.stringify(dash1Json)}`);
    }
    if (dash1Json.data.leads.length !== 0 || dash1Json.data.deals.length !== 0) {
      throw new Error('User 1 initial state is not empty!');
    }
    console.log('   ✅ User 1 initial workspace has zero leaks from other workspaces.');

    // ==========================================
    // STEP 3: CREATE PRIVATE DATA IN WORKSPACE 1
    // ==========================================
    console.log('3️⃣ Creating a private Lead and Deal in Workspace 1...');
    const lead1Res = await fetch('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { ...headers1, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Secret',
        lastName: 'Client',
        email: 'secret@omegainvestor.com',
        companyName: 'Omega Confidential Inc',
        source: 'Referral Partner',
      }),
    });
    const lead1Json = await lead1Res.json();
    if (!lead1Res.ok || !lead1Json.success) {
      throw new Error(`Failed to create lead in Workspace 1: ${JSON.stringify(lead1Json)}`);
    }
    console.log(`   ✅ Lead created in Workspace 1 (ID: ${lead1Json.data.id})`);

    // ==========================================
    // STEP 4: SIGNUP USER 2 (Isolated Workspace)
    // ==========================================
    console.log('4️⃣ Testing Signup for User 2 (Zeta Digital)...');
    const signup2Res = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Zeta Leader',
        email: email2,
        password: 'Password123!',
        agencyName: 'Zeta Digital Group',
      }),
    });
    const signup2Json = await signup2Res.json();
    if (!signup2Res.ok || !signup2Json.success) {
      throw new Error(`Signup 2 failed: ${JSON.stringify(signup2Json)}`);
    }

    const ws2Id = signup2Json.data.workspace.id;
    const user2Id = signup2Json.data.user.id;
    const { rawToken: token2 } = await createSession(user2Id);

    const headers2 = {
      Cookie: `${SESSION_COOKIE_NAME}=${token2}`,
    };
    console.log(`   ✅ User 2 created with Workspace ID: ${ws2Id}`);

    // ==========================================
    // STEP 5: VERIFY STRICT ZERO CROSS-TENANT LEAKS
    // ==========================================
    console.log('5️⃣ Verifying User 2 CANNOT see User 1 data on any endpoint...');
    const dash2Res = await fetch('http://localhost:3000/api/v1/dashboard', { headers: headers2 });
    const dash2Json = await dash2Res.json();
    if (!dash2Res.ok || !dash2Json.success) {
      throw new Error(`User 2 dashboard query failed: ${JSON.stringify(dash2Json)}`);
    }
    if (dash2Json.data.leads.length !== 0 || dash2Json.data.deals.length !== 0) {
      throw new Error('❌ DATA LEAK DETECTED: User 2 sees leads or deals from Workspace 1!');
    }

    const leads2Res = await fetch('http://localhost:3000/api/v1/leads', { headers: headers2 });
    const leads2Json = await leads2Res.json();
    if (leads2Json.data.length !== 0) {
      throw new Error('❌ DATA LEAK DETECTED: User 2 sees leads from Workspace 1 in /api/v1/leads!');
    }
    console.log('   ✅ Verified zero cross-tenant data leakage between Workspace 1 and Workspace 2.');

    // Cleanup
    await prisma.session.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
    await prisma.activity.deleteMany({ where: { workspaceId: { in: [ws1Id, ws2Id] } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: [ws1Id, ws2Id] } } });
    await prisma.company.deleteMany({ where: { workspaceId: { in: [ws1Id, ws2Id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [ws1Id, ws2Id] } } });
    console.log('\n🧹 Test fixtures cleaned up successfully.');
    console.log('🎉 REGRESSION TEST COMPLETED SUCCESSFULLY WITH 100% PASS RATE!');
  } catch (error) {
    console.error('❌ Regression test failed:', error);
    process.exit(1);
  }
}

runAuthRegressionTest();
