import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

async function runSmokeTests() {
  console.log('💨 Starting Post-Migration End-to-End Application Smoke Tests...\n');

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

  let smokeWorkspaceId: string | undefined;

  try {
    // 1. Check existing migrated workspace & data lookup
    console.log('--- 1. Query Migrated Workspace Data ---');
    const apexWs = await prisma.workspace.findFirst({
      where: { slug: 'apex-digital' },
      include: {
        users: true,
        companies: { include: { contacts: true, deals: true } },
        leads: true,
        deals: true,
        tasks: true,
        activities: true,
        deliverables: true,
      },
    });

    assert(Boolean(apexWs), 'Apex Digital Agency workspace found in PostgreSQL');
    assert((apexWs?.users.length || 0) > 0, `Users found in workspace: ${apexWs?.users.length}`);
    assert((apexWs?.companies.length || 0) > 0, `Companies found in workspace: ${apexWs?.companies.length}`);
    assert((apexWs?.leads.length || 0) > 0, `Leads found in workspace: ${apexWs?.leads.length}`);
    assert((apexWs?.deals.length || 0) > 0, `Deals found in workspace: ${apexWs?.deals.length}`);
    assert((apexWs?.activities.length || 0) > 0, `Activities found in workspace: ${apexWs?.activities.length}`);

    // 2. HTTP End-to-End Authentication & Dashboard Load
    console.log('\n--- 2. End-to-End Auth & Dashboard Verification ---');
    const smokeSuffix = `smoke_${Date.now()}`;
    const smokeEmail = `${smokeSuffix}@smokeagency.test`;
    const smokePassword = 'SmokeTestSecure2026!';
    const smokeHash = await hashPassword(smokePassword);

    const smokeWs = await prisma.workspace.create({
      data: {
        name: 'Smoke Test Agency',
        slug: `smoke-agency-${smokeSuffix}`,
        users: {
          create: {
            email: smokeEmail,
            passwordHash: smokeHash,
            fullName: 'Smoke Test Owner',
            role: 'OWNER',
          },
        },
      },
      include: { users: true },
    });
    smokeWorkspaceId = smokeWs.id;

    // Create a sample lead, deal, company in the smoke workspace to test API responses
    const smokeCompany = await prisma.company.create({
      data: {
        workspaceId: smokeWorkspaceId,
        name: 'Smoke Client Corp',
        domain: 'smokeclient.test',
      },
    });

    await prisma.lead.create({
      data: {
        workspaceId: smokeWorkspaceId,
        firstName: 'Smoke',
        lastName: 'Lead',
        email: `lead_${smokeSuffix}@smokeclient.test`,
        companyName: 'Smoke Client Corp',
        status: 'NEW',
      },
    });

    await prisma.deal.create({
      data: {
        workspaceId: smokeWorkspaceId,
        companyId: smokeCompany.id,
        title: 'Smoke Test Retainer',
        value: 12000,
        stage: 'DISCOVERY',
      },
    });

    // Login via API
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.99.2.1' },
      body: JSON.stringify({
        email: smokeEmail,
        password: smokePassword,
      }),
    });

    assert(loginRes.status === 200, `User logged in via HTTP (Status: ${loginRes.status})`);
    const setCookie = loginRes.headers.get('set-cookie') || '';
    assert(setCookie.includes('agencyflow_session'), 'Session cookie issued on login');

    const cookieMatch = setCookie.match(/agencyflow_session=([^;]+)/);
    const sessionToken = cookieMatch ? cookieMatch[1] : '';

    // Test /api/v1/auth/me
    const meRes = await fetch('http://localhost:3000/api/v1/auth/me', {
      headers: { Cookie: `agencyflow_session=${sessionToken}`, 'X-Forwarded-For': '10.99.2.1' },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data?.user?.email === smokeEmail, '/api/v1/auth/me resolves authenticated user from PostgreSQL');

    // Test /api/v1/dashboard
    const dashRes = await fetch('http://localhost:3000/api/v1/dashboard', {
      headers: { Cookie: `agencyflow_session=${sessionToken}`, 'X-Forwarded-For': '10.99.2.1' },
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200 && dashData.success === true, 'Dashboard API loads data from PostgreSQL');
    assert(dashData.data?.workspaceName === smokeWs.name, `Dashboard displays correct workspace name (${dashData.data?.workspaceName})`);

    // Test /api/v1/leads
    const leadsRes = await fetch('http://localhost:3000/api/v1/leads', {
      headers: { Cookie: `agencyflow_session=${sessionToken}`, 'X-Forwarded-For': '10.99.2.1' },
    });
    const leadsData = await leadsRes.json();
    assert(leadsRes.status === 200 && Array.isArray(leadsData.data), `Leads API returns workspace leads from PostgreSQL (Count: ${leadsData.data?.length})`);

    // Test /api/v1/deals
    const dealsRes = await fetch('http://localhost:3000/api/v1/deals', {
      headers: { Cookie: `agencyflow_session=${sessionToken}`, 'X-Forwarded-For': '10.99.2.1' },
    });
    const dealsData = await dealsRes.json();
    assert(dealsRes.status === 200 && Array.isArray(dealsData.data?.columns), 'Deals API returns workspace deals pipeline from PostgreSQL');

    // Test /api/v1/clients
    const clientsRes = await fetch('http://localhost:3000/api/v1/clients', {
      headers: { Cookie: `agencyflow_session=${sessionToken}`, 'X-Forwarded-For': '10.99.2.1' },
    });
    const clientsData = await clientsRes.json();
    assert(clientsRes.status === 200 && Array.isArray(clientsData.data), `Clients API returns workspace companies/contacts from PostgreSQL (Count: ${clientsData.data?.length})`);

    // Test Logout
    console.log('\n--- 3. Logout & Session Invalidation ---');
    const logoutRes = await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers: { Cookie: `agencyflow_session=${sessionToken}`, 'X-Forwarded-For': '10.99.2.1' },
    });
    assert(logoutRes.status === 200, 'Logout succeeded via API');

    // Verify Session Invalidation
    const mePostLogout = await fetch('http://localhost:3000/api/v1/auth/me', {
      headers: { Cookie: `agencyflow_session=${sessionToken}`, 'X-Forwarded-For': '10.99.2.1' },
    });
    assert(mePostLogout.status === 401, 'Session rejected post-logout with 401');

    // Test Re-Login
    const reloginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.99.2.1' },
      body: JSON.stringify({
        email: smokeEmail,
        password: smokePassword,
      }),
    });
    assert(reloginRes.status === 200, 'Re-login with credentials succeeds');

    // Unauthenticated Protected Route Redirects
    console.log('\n--- 4. Unauthenticated Protected Route Access ---');
    const directLogin = await fetch('http://localhost:3000/login', { redirect: 'manual' });
    assert(directLogin.status === 200, 'Direct /login accessible (200 OK)');

    const directSignup = await fetch('http://localhost:3000/signup', { redirect: 'manual' });
    assert(directSignup.status === 200, 'Direct /signup accessible (200 OK)');
  } catch (err: any) {
    assert(false, `Smoke test error: ${err.message}`);
  } finally {
    // Clean up smoke test workspace and records
    if (smokeWorkspaceId) {
      await prisma.workspace.delete({ where: { id: smokeWorkspaceId } }).catch(() => {});
    }
  }

  console.log('\n========================================');
  console.log(`Smoke Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests()
  .catch((err) => {
    console.error('Fatal smoke test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
