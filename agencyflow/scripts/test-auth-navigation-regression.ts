import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runNavigationRegressionTests() {
  console.log('🚀 Running Comprehensive Authentication Navigation & Stale Cookie Regression Suite...\n');

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

  // --- SUITE 1: Unauthenticated Direct Navigation ---
  console.log('--- 1. Unauthenticated Direct Navigation to Public Auth Routes ---');
  try {
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'GET',
      redirect: 'manual',
    });
    assert(loginRes.status === 200, `GET /login returns 200 OK for unauthenticated user (actual: ${loginRes.status})`);

    const signupRes = await fetch(`${BASE_URL}/signup`, {
      method: 'GET',
      redirect: 'manual',
    });
    assert(signupRes.status === 200, `GET /signup returns 200 OK for unauthenticated user (actual: ${signupRes.status})`);
  } catch (err: any) {
    assert(false, `Public auth routes unreachable: ${err.message}`);
  }

  // --- SUITE 2: Stale / Expired / Invalid Cookie Resilience ---
  console.log('\n--- 2. Stale / Expired Cookie Resilience (Prevent Deadlock) ---');
  try {
    const staleCookie = 'agencyflow_session=stale_expired_token_deadlock_test_99999';

    const loginWithStaleCookie = await fetch(`${BASE_URL}/login`, {
      method: 'GET',
      headers: { Cookie: staleCookie },
      redirect: 'manual',
    });
    assert(
      loginWithStaleCookie.status === 200,
      `GET /login with stale cookie returns 200 OK (NOT redirected to /dashboard) (actual: ${loginWithStaleCookie.status})`
    );

    const signupWithStaleCookie = await fetch(`${BASE_URL}/signup`, {
      method: 'GET',
      headers: { Cookie: staleCookie },
      redirect: 'manual',
    });
    assert(
      signupWithStaleCookie.status === 200,
      `GET /signup with stale cookie returns 200 OK (NOT redirected to /dashboard) (actual: ${signupWithStaleCookie.status})`
    );

    // Verify /api/v1/auth/me clears dead cookie on 401
    const authMeStaleRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: { Cookie: staleCookie },
    });
    assert(authMeStaleRes.status === 401, `GET /api/v1/auth/me with stale cookie returns 401 Unauthorized`);
    const setCookieHeader = authMeStaleRes.headers.get('set-cookie') || '';
    assert(
      setCookieHeader.includes('agencyflow_session=;') || setCookieHeader.includes('Max-Age=0'),
      `GET /api/v1/auth/me 401 response explicitly revokes dead session cookie via Set-Cookie`
    );
  } catch (err: any) {
    assert(false, `Stale cookie test failed: ${err.message}`);
  }

  // --- SUITE 3: Protected Route Enforcement ---
  console.log('\n--- 3. Protected Route Middleware Enforcement ---');
  try {
    const protectedPaths = ['/dashboard', '/leads', '/pipeline', '/projects', '/tasks', '/invoices'];
    for (const path of protectedPaths) {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        redirect: 'manual',
      });
      const location = res.headers.get('location') || '';
      assert(
        res.status === 307 && location.includes('/login'),
        `GET ${path} redirects unauthenticated user to /login (status: ${res.status}, location: ${location})`
      );
    }
  } catch (err: any) {
    assert(false, `Protected route test failed: ${err.message}`);
  }

  // --- SUITE 4: Full Authentication Lifecycle & Re-Authentication ---
  console.log('\n--- 4. Full Authentication Lifecycle & Re-Authentication ---');
  const uniqueTestId = Date.now();
  const testEmail = `nav_test_${uniqueTestId}@agencytest.com`;
  const testPass = 'AgencyFlowSecurePass2026!';
  const testIp = `198.51.100.${uniqueTestId % 250}`;
  let validCookie = '';

  try {
    // 1. Signup
    const signupRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': testIp,
      },
      body: JSON.stringify({
        fullName: 'Navigation Tester',
        email: testEmail,
        agencyName: 'Nav Regression Agency',
        password: testPass,
      }),
    });
    assert(signupRes.status === 200 || signupRes.status === 201, `POST /api/v1/auth/signup creates account (actual: ${signupRes.status})`);
    validCookie = signupRes.headers.get('set-cookie') || '';
    assert(validCookie.includes('agencyflow_session='), `Signup returns active agencyflow_session cookie`);

    // Clean cookie format for subsequent requests
    const sessionCookieOnly = validCookie.split(';')[0];

    // 2. Auth me with active session
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: {
        Cookie: sessionCookieOnly,
        'X-Forwarded-For': testIp,
      },
    });
    assert(meRes.status === 200, `GET /api/v1/auth/me authenticates valid session`);
    const meData = await meRes.json();
    assert(meData.data?.user?.email === testEmail, `Auth session matches signed up user email`);

    // 3. Logout
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: sessionCookieOnly,
        'X-Forwarded-For': testIp,
      },
    });
    assert(logoutRes.status === 200, `POST /api/v1/auth/logout succeeds`);

    // 4. Invalidation verification
    const meAfterLogout = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: {
        Cookie: sessionCookieOnly,
        'X-Forwarded-For': testIp,
      },
    });
    assert(meAfterLogout.status === 401, `GET /api/v1/auth/me rejects logged-out session (401)`);

    // 5. Reachability of login after logout
    const loginAfterLogout = await fetch(`${BASE_URL}/login`, {
      headers: {
        Cookie: sessionCookieOnly,
        'X-Forwarded-For': testIp,
      },
      redirect: 'manual',
    });
    assert(loginAfterLogout.status === 200, `GET /login is immediately accessible post-logout without deadlocking`);

    // 6. Login again
    const reLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': testIp,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPass,
      }),
    });
    assert(reLoginRes.status === 200, `POST /api/v1/auth/login authenticates user again`);
    const newCookie = reLoginRes.headers.get('set-cookie') || '';
    const newSessionCookie = newCookie.split(';')[0];

    const meAfterReLogin = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: {
        Cookie: newSessionCookie,
        'X-Forwarded-For': testIp,
      },
    });
    assert(meAfterReLogin.status === 200, `GET /api/v1/auth/me authenticates re-logged-in session`);
  } catch (err: any) {
    assert(false, `Auth lifecycle test failed: ${err.message}`);
  } finally {
    // Clean up test user & workspace
    try {
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      if (user) {
        await prisma.workspace.delete({ where: { id: user.workspaceId } });
      }
    } catch {}
  }

  console.log('\n========================================');
  console.log(`Navigation Regression Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNavigationRegressionTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
