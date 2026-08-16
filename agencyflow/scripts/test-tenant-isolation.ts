import { prisma } from '../src/lib/prisma';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

async function runTenantIsolationTest() {
  console.log('🧪 Starting Multi-Tenant Isolation & Onboarding Automated Test...\n');

  try {
    const timestamp = Date.now();
    const emailA = `alice_${timestamp}@agencyalpha.test`;
    const emailB = `bob_${timestamp}@agencybeta.test`;

    // 1. Sign up User A
    console.log('1️⃣ Creating Workspace A (Agency Alpha) & User A...');
    const signupARes = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': `10.0.0.${timestamp % 200}`,
      },
      body: JSON.stringify({
        fullName: 'Alice Sterling',
        email: emailA,
        password: 'Password123!',
        agencyName: 'Agency Alpha',
      }),
    });
    const signupAJson = await signupARes.json();
    if (!signupARes.ok || !signupAJson.success) {
      throw new Error(`Signup A failed: ${JSON.stringify(signupAJson)}`);
    }

    const workspaceIdA = signupAJson.data.workspace.id;
    const userIdA = signupAJson.data.user.id;
    const { rawToken: tokenA } = await createSession(userIdA);

    const headersA = {
      Cookie: `${SESSION_COOKIE_NAME}=${tokenA}`,
      'X-Forwarded-For': `10.0.0.${timestamp % 200}`,
    };
    console.log(`   ✅ Workspace A created: ${workspaceIdA}`);

    // 2. Verify User A initial state is completely 0 / clean
    console.log('2️⃣ Verifying Workspace A has zero data...');
    const meARes = await fetch('http://localhost:3000/api/v1/auth/me', { headers: headersA });
    const meAJson = await meARes.json();
    if (meAJson.data.workspace.hasAnyData) {
      throw new Error('Workspace A should not have any data initially!');
    }
    console.log('   ✅ Workspace A verified empty');

    // 3. User A creates custom data in Workspace A
    console.log('3️⃣ User A creates custom Lead and Deal in Workspace A...');
    const leadRes = await fetch('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { ...headersA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Alpha',
        lastName: 'Client',
        email: 'alpha@client.com',
        companyName: 'Alpha Ventures',
        source: 'Website Inbound',
      }),
    });
    const leadJson = await leadRes.json();
    if (!leadRes.ok || !leadJson.success) {
      throw new Error('Failed to create lead in Workspace A');
    }
    console.log('   ✅ Custom lead created in Workspace A');

    // 4. Sign up User B
    console.log('4️⃣ Creating Workspace B (Agency Beta) & User B...');
    const signupBRes = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': `10.0.1.${timestamp % 200}`,
      },
      body: JSON.stringify({
        fullName: 'Bob Roberts',
        email: emailB,
        password: 'Password123!',
        agencyName: 'Agency Beta',
      }),
    });
    const signupBJson = await signupBRes.json();
    if (!signupBRes.ok || !signupBJson.success) {
      throw new Error(`Signup B failed: ${JSON.stringify(signupBJson)}`);
    }

    const workspaceIdB = signupBJson.data.workspace.id;
    const userIdB = signupBJson.data.user.id;
    const { rawToken: tokenB } = await createSession(userIdB);

    const headersB = {
      Cookie: `${SESSION_COOKIE_NAME}=${tokenB}`,
    };
    console.log(`   ✅ Workspace B created: ${workspaceIdB}`);

    // 5. Verify Workspace B has ZERO data (no data leak from Workspace A)
    console.log('5️⃣ Verifying Workspace B cannot see any data from Workspace A...');
    const leadsBRes = await fetch('http://localhost:3000/api/v1/leads', { headers: headersB });
    const leadsBJson = await leadsBRes.json();
    if (leadsBJson.data.length !== 0) {
      throw new Error('DATA LEAK: Workspace B sees leads from Workspace A!');
    }

    const dashBRes = await fetch('http://localhost:3000/api/v1/dashboard', { headers: headersB });
    const dashBJson = await dashBRes.json();
    if (dashBJson.data.leads.length !== 0 || dashBJson.data.deals.length !== 0) {
      throw new Error('DATA LEAK: Workspace B dashboard displays Workspace A data!');
    }
    console.log('   ✅ Zero data leak verified between Workspace A and Workspace B');

    // Cleanup
    await prisma.session.deleteMany({ where: { userId: { in: [userIdA, userIdB] } } });
    await prisma.activity.deleteMany({ where: { workspaceId: { in: [workspaceIdA, workspaceIdB] } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: [workspaceIdA, workspaceIdB] } } });
    await prisma.company.deleteMany({ where: { workspaceId: { in: [workspaceIdA, workspaceIdB] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userIdA, userIdB] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [workspaceIdA, workspaceIdB] } } });
    console.log('\n🧹 Test workspaces cleaned up.');
    console.log('🎉 ALL TENANT ISOLATION TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTenantIsolationTest();
