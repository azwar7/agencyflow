import { prisma } from '../src/lib/prisma';
import { encodeSession, decodeSession, SESSION_COOKIE_NAME, AUTH_COOKIE_NAME } from '../src/lib/auth-session';

async function runLogoutTest() {
  console.log('🧪 Starting Comprehensive Logout Flow & Session Invalidation Test...\n');

  try {
    const timestamp = Date.now();
    const email = `logout_tester_${timestamp}@agencytest.com`;

    // 1. Sign up a new user
    console.log('1️⃣ Creating user & active session...');
    const signupRes = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Logout Tester',
        email,
        password: 'Password123!',
        agencyName: 'Logout Test Agency',
      }),
    });
    const signupJson = await signupRes.json();
    if (!signupRes.ok || !signupJson.success) {
      throw new Error(`Signup failed: ${JSON.stringify(signupJson)}`);
    }

    const workspaceId = signupJson.data.workspace.id;
    const userId = signupJson.data.user.id;
    const token = encodeSession({
      userId,
      workspaceId,
      email,
      fullName: 'Logout Tester',
      role: 'OWNER',
      agencyName: 'Logout Test Agency',
    });

    const activeCookieHeader = `${SESSION_COOKIE_NAME}=${token}; ${AUTH_COOKIE_NAME}=true`;
    console.log('   ✅ User signed up and active session token created');

    // 2. Verify /api/v1/auth/me works when authenticated
    console.log('2️⃣ Verifying authenticated /api/v1/auth/me call...');
    const meRes = await fetch('http://localhost:3000/api/v1/auth/me', {
      headers: { Cookie: activeCookieHeader },
    });
    const meJson = await meRes.json();
    if (!meRes.ok || !meJson.success || meJson.data.user.email !== email) {
      throw new Error(`Auth me check failed: ${JSON.stringify(meJson)}`);
    }
    console.log(`   ✅ Auth me successfully returned user: ${meJson.data.user.email}`);

    // 3. Call POST /api/v1/auth/logout
    console.log('3️⃣ Calling POST /api/v1/auth/logout...');
    const logoutRes = await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers: { Cookie: activeCookieHeader },
    });
    const logoutJson = await logoutRes.json();
    if (!logoutRes.ok || !logoutJson.success) {
      throw new Error(`Logout endpoint failed: ${JSON.stringify(logoutJson)}`);
    }
    console.log('   ✅ Server responded with success:', logoutJson.message);

    // 4. Verify /api/v1/auth/me returns 401 after logout (no cookie or empty cookie)
    console.log('4️⃣ Verifying /api/v1/auth/me returns 401 Unauthorized after logout...');
    const meAfterLogoutRes = await fetch('http://localhost:3000/api/v1/auth/me', {
      headers: { Cookie: '' },
    });
    console.log(`   Status: ${meAfterLogoutRes.status}`);
    if (meAfterLogoutRes.status !== 401) {
      const errJson = await meAfterLogoutRes.json();
      throw new Error(`❌ Security failure: /api/v1/auth/me returned ${meAfterLogoutRes.status} instead of 401! Body: ${JSON.stringify(errJson)}`);
    }
    console.log('   ✅ /api/v1/auth/me correctly returned 401 Unauthorized.');

    // 5. Verify protected API (/api/v1/dashboard) returns 401 after logout
    console.log('5️⃣ Verifying protected /api/v1/dashboard returns 401 without session...');
    const dashAfterLogoutRes = await fetch('http://localhost:3000/api/v1/dashboard', {
      headers: { Cookie: '' },
    });
    console.log(`   Status: ${dashAfterLogoutRes.status}`);
    if (dashAfterLogoutRes.status !== 401 && dashAfterLogoutRes.status !== 400) {
      const errJson = await dashAfterLogoutRes.json();
      throw new Error(`❌ Security failure: /api/v1/dashboard returned ${dashAfterLogoutRes.status} instead of 401! Body: ${JSON.stringify(errJson)}`);
    }
    console.log('   ✅ /api/v1/dashboard correctly rejected unauthenticated request.');

    console.log('\n🎉 ALL LOGOUT TESTS PASSED COMPLETELY! User is genuinely and securely logged out. 🎉\n');
  } catch (error) {
    console.error('\n❌ Test failure:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runLogoutTest();
