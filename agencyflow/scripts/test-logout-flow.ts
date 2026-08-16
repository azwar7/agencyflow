import { prisma } from '../src/lib/prisma';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

async function runLogoutTest() {
  console.log('🧪 Starting Comprehensive Logout Flow & Session Invalidation Test...\n');

  try {
    const timestamp = Date.now();
    const email = `logout_tester_${timestamp}@agencytest.com`;

    // 1. Sign up a new user
    console.log('1️⃣ Creating user & active session...');
    const signupRes = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': `10.2.0.${timestamp % 200}`,
      },
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
    const { rawToken: token } = await createSession(userId);

    const activeCookieHeader = `${SESSION_COOKIE_NAME}=${token}`;
    console.log('   ✅ User signed up and active session token created');

    // 2. Verify /api/v1/auth/me works when authenticated
    console.log('2️⃣ Verifying authenticated /api/v1/auth/me call...');
    const meRes = await fetch('http://localhost:3000/api/v1/auth/me', {
      headers: { Cookie: activeCookieHeader },
    });
    const meJson = await meRes.json();
    if (!meRes.ok || !meJson.success) {
      throw new Error(`Authenticated /api/v1/auth/me failed: ${JSON.stringify(meJson)}`);
    }
    console.log(`   ✅ /api/v1/auth/me authenticated as ${meJson.data.user.email}`);

    // 3. Perform Logout on server
    console.log('3️⃣ Calling POST /api/v1/auth/logout to invalidate server session...');
    const logoutRes = await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers: { Cookie: activeCookieHeader },
    });
    const logoutJson = await logoutRes.json();
    if (!logoutRes.ok || !logoutJson.success) {
      throw new Error(`Logout endpoint failed: ${JSON.stringify(logoutJson)}`);
    }
    console.log('   ✅ Server responded with logout success');

    // 4. Verify post-logout: old session token is completely invalidated on server
    console.log('4️⃣ Testing re-use of old session token against /api/v1/auth/me...');
    const postLogoutMeRes = await fetch('http://localhost:3000/api/v1/auth/me', {
      headers: { Cookie: activeCookieHeader },
    });
    if (postLogoutMeRes.status !== 401) {
      throw new Error(`Expected 401 after logout but got ${postLogoutMeRes.status}`);
    }
    console.log('   ✅ Server rejected invalidated session token with 401 Unauthorized.');

    // Cleanup
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    console.log('\n🧹 Test user cleaned up.');
    console.log('🎉 ALL LOGOUT TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('❌ Logout test failed:', error);
    process.exit(1);
  }
}

runLogoutTest();
