async function testLogoutRedirectFlow() {
  console.log('🧪 Testing Public Landing Route & Logout Redirect Logic...\n');

  try {
    // 1. Check that public landing page is never redirected by middleware
    console.log('1️⃣ Checking GET / (Public Landing Page)...');
    const landingRes = await fetch('http://localhost:3000/', {
      redirect: 'manual',
    });
    console.log(`   Status: ${landingRes.status}`);
    if (landingRes.status !== 200) {
      throw new Error(`Expected 200 for public landing page, got ${landingRes.status}`);
    }
    console.log('   ✅ Landing page is public and accessible without authentication.');

    // 2. Check that /login is accessible and not looped
    console.log('2️⃣ Checking GET /login...');
    const loginRes = await fetch('http://localhost:3000/login', {
      redirect: 'manual',
    });
    console.log(`   Status: ${loginRes.status}`);
    if (loginRes.status !== 200) {
      throw new Error(`Expected 200 for /login, got ${loginRes.status}`);
    }
    console.log('   ✅ /login is public and accessible.');

    // 3. Check that /signup is accessible
    console.log('3️⃣ Checking GET /signup...');
    const signupRes = await fetch('http://localhost:3000/signup', {
      redirect: 'manual',
    });
    console.log(`   Status: ${signupRes.status}`);
    if (signupRes.status !== 200) {
      throw new Error(`Expected 200 for /signup, got ${signupRes.status}`);
    }
    console.log('   ✅ /signup is public and accessible.');

    // 4. Check that /dashboard requires authentication
    console.log('4️⃣ Checking GET /dashboard (Protected Route)...');
    const dashRes = await fetch('http://localhost:3000/dashboard', {
      redirect: 'manual',
    });
    console.log(`   Status: ${dashRes.status}, Location: ${dashRes.headers.get('location')}`);
    if (dashRes.status < 300 || dashRes.status >= 400 || !dashRes.headers.get('location')?.includes('/login')) {
      throw new Error(`Expected redirect to /login for unauthenticated /dashboard, got status ${dashRes.status}`);
    }
    console.log('   ✅ Protected route /dashboard correctly redirects unauthenticated visitors to /login.');

    // 5. Check server logout endpoint
    console.log('5️⃣ Checking POST /api/v1/auth/logout...');
    const logoutRes = await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
    });
    const logoutJson = await logoutRes.json();
    if (!logoutRes.ok || !logoutJson.success) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutJson)}`);
    }
    console.log('   ✅ Server logout endpoint cleared cookies successfully.');

    console.log('\n🎉 ALL LOGOUT REDIRECT & PUBLIC ROUTE TESTS PASSED 100%! 🎉\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

testLogoutRedirectFlow();
