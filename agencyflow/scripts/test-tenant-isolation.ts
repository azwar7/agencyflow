import { prisma } from '../src/lib/prisma';
import { encodeSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

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
      headers: { 'Content-Type': 'application/json' },
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
    const tokenA = encodeSession({
      userId: userIdA,
      workspaceId: workspaceIdA,
      email: emailA,
      fullName: 'Alice Sterling',
      role: 'OWNER',
      agencyName: 'Agency Alpha',
    });
    const headersA = {
      Cookie: `${SESSION_COOKIE_NAME}=${tokenA}`,
      'x-workspace-id': workspaceIdA,
    };
    console.log(`   ✅ Workspace A created: ${workspaceIdA}`);

    // 2. Verify User A initial state is completely 0 / clean
    console.log('2️⃣ Verifying Workspace A starts with 0 data...');
    const dashARes = await fetch('http://localhost:3000/api/v1/dashboard', {
      headers: headersA,
    });
    const dashAJson = await dashARes.json();
    console.log('   Dashboard A metrics:', dashAJson.data?.metrics);
    if (
      dashAJson.data?.metrics?.totalLeads !== 0 ||
      dashAJson.data?.metrics?.totalPipelineValue !== 0 ||
      dashAJson.data?.metrics?.activeDealsCount !== 0 ||
      dashAJson.data?.topClients?.length !== 0 ||
      dashAJson.data?.recentActivities?.length !== 0 ||
      dashAJson.data?.urgentTasks?.length !== 0
    ) {
      throw new Error(`❌ Workspace A is not empty on initial signup! Data: ${JSON.stringify(dashAJson)}`);
    }
    console.log('   ✅ Workspace A is confirmed 100% clean and empty (0 counts)!');

    // 3. User A creates custom private lead
    console.log('3️⃣ User A creates custom private lead "Secret Client Alpha"...');
    const leadCreateRes = await fetch('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headersA },
      body: JSON.stringify({
        companyName: 'Secret Client Alpha Corp',
        firstName: 'Arthur',
        lastName: 'Pendleton',
        email: 'arthur@secretalpha.com',
        phone: '+1-555-0199',
        source: 'INBOUND',
        status: 'NEW',
        leadScore: 92,
      }),
    });
    const leadCreateJson = await leadCreateRes.json();
    if (!leadCreateRes.ok || !leadCreateJson.success) {
      throw new Error(`Failed to create lead in Workspace A: ${JSON.stringify(leadCreateJson)}`);
    }
    console.log('   ✅ Lead created in Workspace A');

    // 4. Sign up User B
    console.log('4️⃣ Creating Workspace B (Beta Agency) & User B...');
    const signupBRes = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bob Builder',
        email: emailB,
        password: 'Password123!',
        agencyName: 'Beta Agency',
      }),
    });
    const signupBJson = await signupBRes.json();
    if (!signupBRes.ok || !signupBJson.success) {
      throw new Error(`Signup B failed: ${JSON.stringify(signupBJson)}`);
    }

    const workspaceIdB = signupBJson.data.workspace.id;
    const userIdB = signupBJson.data.user.id;
    const tokenB = encodeSession({
      userId: userIdB,
      workspaceId: workspaceIdB,
      email: emailB,
      fullName: 'Bob Builder',
      role: 'OWNER',
      agencyName: 'Beta Agency',
    });
    const headersB = {
      Cookie: `${SESSION_COOKIE_NAME}=${tokenB}`,
      'x-workspace-id': workspaceIdB,
    };
    console.log(`   ✅ Workspace B created: ${workspaceIdB}`);

    // 5. Verify User B CANNOT see User A's data
    console.log('5️⃣ Verifying Tenant Isolation: User B CANNOT see User A data...');
    const leadsBRes = await fetch('http://localhost:3000/api/v1/leads', {
      headers: headersB,
    });
    const leadsBJson = await leadsBRes.json();
    const foundAInB = leadsBJson.data?.some((l: any) => l.companyName?.includes('Secret Client Alpha'));
    if (foundAInB || leadsBJson.data?.length !== 0) {
      throw new Error(`❌ DATA LEAK DETECTED: Workspace B can see leads from Workspace A! Leads: ${JSON.stringify(leadsBJson.data)}`);
    }
    console.log('   ✅ Workspace B returned 0 leads. Isolation confirmed!');

    // 6. Test User B toggling sample data ON
    console.log('6️⃣ User B toggles sample data ON...');
    const sampleBRes = await fetch('http://localhost:3000/api/v1/workspace/sample-data', {
      method: 'POST',
      headers: headersB,
    });
    const sampleBJson = await sampleBRes.json();
    console.log(`   ✅ Sample data generated for Workspace B: ${sampleBJson.message}`);

    const leadsBAfterSampleRes = await fetch('http://localhost:3000/api/v1/leads', {
      headers: headersB,
    });
    const leadsBAfterSampleJson = await leadsBAfterSampleRes.json();
    console.log(`   ✅ Workspace B now has ${leadsBAfterSampleJson.data?.length} sample leads.`);
    if (!leadsBAfterSampleJson.data || leadsBAfterSampleJson.data.length === 0) {
      throw new Error('❌ Sample data injection failed to populate leads in Workspace B');
    }

    // 7. Verify User A is still isolated from User B's sample data
    console.log('7️⃣ Verifying User A is unaffected by User B sample data...');
    const leadsARes = await fetch('http://localhost:3000/api/v1/leads', {
      headers: headersA,
    });
    const leadsAJson = await leadsARes.json();
    if (leadsAJson.data?.length !== 1 || leadsAJson.data[0].companyName !== 'Secret Client Alpha Corp') {
      throw new Error(`❌ Workspace A data polluted by Workspace B: ${JSON.stringify(leadsAJson.data)}`);
    }
    console.log('   ✅ Workspace A still has ONLY its 1 custom lead.');

    // 8. User B clears sample data
    console.log('8️⃣ User B clears sample data...');
    const clearBRes = await fetch('http://localhost:3000/api/v1/workspace/sample-data', {
      method: 'DELETE',
      headers: headersB,
    });
    const clearBJson = await clearBRes.json();
    console.log(`   ✅ Sample data cleared: ${clearBJson.message}`);

    const leadsBClearedRes = await fetch('http://localhost:3000/api/v1/leads', {
      headers: headersB,
    });
    const leadsBClearedJson = await leadsBClearedRes.json();
    if (leadsBClearedJson.data?.length !== 0) {
      throw new Error(`❌ Sample data clear failed in Workspace B: ${JSON.stringify(leadsBClearedJson.data)}`);
    }
    console.log('   ✅ Workspace B is completely clean again (0 leads).');

    console.log('\n🎉 ALL MULTI-TENANT ISOLATION AND ONBOARDING TESTS PASSED PERFECTLY! 🎉\n');
  } catch (error) {
    console.error('\n❌ Test failure:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTenantIsolationTest();
