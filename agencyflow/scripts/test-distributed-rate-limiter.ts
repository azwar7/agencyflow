import { checkRateLimit, resetRateLimitStore, getClientIp, createRateLimitResponse } from '../src/lib/rate-limiter';
import { Redis } from '@upstash/redis';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const BASE_URL = 'http://localhost:3000';

async function runDistributedRateLimiterTests() {
  console.log('⚡ Starting Distributed Upstash Redis Rate Limiting Test Suite...\n');

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

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // --- 1. Upstash Redis Connection Verification ---
  console.log('--- 1. Upstash Redis Connection Verification ---');
  assert(Boolean(redisUrl && redisToken), 'Upstash Redis environment variables are configured');

  let redisAvailable = false;
  if (redisUrl && redisToken) {
    try {
      const directRedis = new Redis({ url: redisUrl, token: redisToken });
      const pingResult = await directRedis.ping();
      assert(pingResult === 'PONG' || pingResult === 'OK', 'Upstash Redis responds to PING command');
      redisAvailable = true;
    } catch (err: any) {
      assert(false, `Redis connection failed: ${err.message}`);
    }
  }

  // Clean up any test rate-limit keys
  await resetRateLimitStore('test-');

  // --- 2. Login Rate Limiting (15 attempts / 15 mins / IP) ---
  console.log('\n--- 2. Login Rate Limiting (15 / 15m / IP) ---');
  const testLoginIp = `test-ip-login-${Date.now()}`;

  // First 15 requests must be allowed
  let all15Allowed = true;
  for (let i = 1; i <= 15; i++) {
    const res = await checkRateLimit(testLoginIp, 'auth-login', 15, 15 * 60);
    if (!res.allowed) {
      all15Allowed = false;
      break;
    }
  }
  assert(all15Allowed, 'First 15 login attempts from same IP are allowed');

  // 16th request must be rejected with allowed: false and accurate retryAfterSeconds
  const login16 = await checkRateLimit(testLoginIp, 'auth-login', 15, 15 * 60);
  assert(!login16.allowed, '16th login attempt is strictly rejected (Rate limit enforced)');
  assert(login16.remaining === 0, 'Remaining allowance is 0');
  assert(login16.retryAfterSeconds > 0 && login16.retryAfterSeconds <= 900, `Retry-After is valid (${login16.retryAfterSeconds}s)`);

  // --- 3. Independent IP Isolation ---
  console.log('\n--- 3. Independent IP Rate Limit Isolation ---');
  const distinctLoginIp = `test-ip-distinct-${Date.now()}`;
  const distinctRes = await checkRateLimit(distinctLoginIp, 'auth-login', 15, 15 * 60);
  assert(distinctRes.allowed, 'Distinct IP is allowed despite previous IP exhaustion');
  assert(distinctRes.remaining === 14, 'Distinct IP has independent remaining quota (14)');

  // --- 4. Signup Rate Limiting (10 attempts / 1 hour / IP) ---
  console.log('\n--- 4. Signup Rate Limiting (10 / 1h / IP) ---');
  const testSignupIp = `test-ip-signup-${Date.now()}`;
  let all10SignupAllowed = true;

  for (let i = 1; i <= 10; i++) {
    const res = await checkRateLimit(testSignupIp, 'auth-signup', 10, 60 * 60);
    if (!res.allowed) {
      all10SignupAllowed = false;
      break;
    }
  }
  assert(all10SignupAllowed, 'First 10 signup attempts are allowed');

  const signup11 = await checkRateLimit(testSignupIp, 'auth-signup', 10, 60 * 60);
  assert(!signup11.allowed, '11th signup attempt is strictly rejected');
  assert(signup11.retryAfterSeconds > 0 && signup11.retryAfterSeconds <= 3600, `Signup Retry-After is valid (${signup11.retryAfterSeconds}s)`);

  // --- 5. AI Workspace Rate Limiting (60 requests / 1 min / Workspace:IP) ---
  console.log('\n--- 5. AI Workspace Rate Limiting (60 / 1m / Workspace) ---');
  const testWsA = `ws-alpha-${Date.now()}`;
  const testWsB = `ws-beta-${Date.now()}`;
  const sharedAiIp = `test-ip-ai-${Date.now()}`;

  let all60AiAllowed = true;
  for (let i = 1; i <= 60; i++) {
    const res = await checkRateLimit(`${testWsA}:${sharedAiIp}`, 'ai-score-lead', 60, 60);
    if (!res.allowed) {
      all60AiAllowed = false;
      break;
    }
  }
  assert(all60AiAllowed, 'First 60 AI evaluations for Workspace A are allowed');

  const ai61 = await checkRateLimit(`${testWsA}:${sharedAiIp}`, 'ai-score-lead', 60, 60);
  assert(!ai61.allowed, '61st AI evaluation for Workspace A is rejected');

  // Verify Workspace B is unaffected
  const wsBRes = await checkRateLimit(`${testWsB}:${sharedAiIp}`, 'ai-score-lead', 60, 60);
  assert(wsBRes.allowed, 'Workspace B is completely unaffected by Workspace A exhaustion (Tenant isolation)');
  assert(wsBRes.remaining === 59, 'Workspace B has independent quota');

  // --- 6. End-to-End HTTP Integration & 429 Headers ---
  console.log('\n--- 6. End-to-End HTTP Route Rate Limiting & Header Verification ---');
  const httpTestIp = `http-test-ip-${Date.now()}`;

  // Exhaust login limit via HTTP POST /api/v1/auth/login
  let http429Encountered = false;
  let receivedRetryAfter: string | null = null;
  let receivedXReset: string | null = null;

  for (let i = 1; i <= 16; i++) {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': httpTestIp,
      },
      body: JSON.stringify({ email: 'nonexistent@test.com', password: 'wrong' }),
    });

    if (res.status === 429) {
      http429Encountered = true;
      receivedRetryAfter = res.headers.get('Retry-After');
      receivedXReset = res.headers.get('X-RateLimit-Reset');
      const body = await res.json();
      assert(body.success === false && body.error?.message.includes('Too many'), 'HTTP 429 returns structured error response');
      break;
    }
  }

  assert(http429Encountered, 'HTTP /api/v1/auth/login returns status 429 when limit exceeded');
  assert(Boolean(receivedRetryAfter), `HTTP 429 contains Retry-After header (${receivedRetryAfter}s)`);
  assert(Boolean(receivedXReset), `HTTP 429 contains X-RateLimit-Reset header (${receivedXReset}s)`);

  // --- 7. Security: Forged x-workspace-id Header Immunity ---
  console.log('\n--- 7. Security: Forged Header Immunity in AI Routes ---');
  // Create an authentic user session in PostgreSQL
  const suffix = Date.now();
  const legitimateWs = await prisma.workspace.create({
    data: {
      name: `Rate Limit Workspace ${suffix}`,
      slug: `rate-limit-ws-${suffix}`,
      users: {
        create: {
          email: `rl_user_${suffix}@ratelimit.test`,
          passwordHash: await hashPassword('SecurePass2026!'),
          fullName: 'RL Tester',
          role: 'OWNER',
        },
      },
    },
    include: { users: true },
  });

  const testUser = legitimateWs.users[0];

  // Login to obtain valid cookie
  const legitLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `legit-ip-${suffix}` },
    body: JSON.stringify({ email: testUser.email, password: 'SecurePass2026!' }),
  });

  const sessionCookie = legitLogin.headers.get('set-cookie') || '';
  const cookieMatch = sessionCookie.match(/agencyflow_session=([^;]+)/);
  const sessionToken = cookieMatch ? cookieMatch[1] : '';

  // Create a lead in the workspace for scoring
  const testLead = await prisma.lead.create({
    data: {
      workspaceId: legitimateWs.id,
      firstName: 'Score',
      lastName: 'Target',
      email: `target_${suffix}@lead.test`,
      companyName: 'Target Corp',
      status: 'NEW',
    },
  });

  // Call AI score lead with forged x-workspace-id header
  const aiResWithForgedHeader = await fetch(`${BASE_URL}/api/v1/ai/score-lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `agencyflow_session=${sessionToken}`,
      'x-workspace-id': 'forged-workspace-99999',
      'x-forwarded-for': `legit-ip-${suffix}`,
    },
    body: JSON.stringify({ leadId: testLead.id }),
  });

  assert(aiResWithForgedHeader.status === 200, 'AI route executes with session workspace (forged x-workspace-id ignored)');

  // Clean up test workspace
  await prisma.workspace.delete({ where: { id: legitimateWs.id } });

  // --- 8. Safe Fallback Resilience Verification ---
  console.log('\n--- 8. Safe Fallback & Error Containment ---');
  // Verify createRateLimitResponse helper
  const helperRes = createRateLimitResponse(30, 'Custom rate limit error');
  assert(helperRes.status === 429, 'createRateLimitResponse produces 429 status');
  assert(helperRes.headers.get('Retry-After') === '30', 'createRateLimitResponse sets Retry-After header');

  // Verify getClientIp sanitization
  const mockReqValid = new Request('http://localhost', {
    headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
  });
  assert(getClientIp(mockReqValid) === '203.0.113.195', 'getClientIp extracts valid leftmost IPv4');

  const mockReqMalformed = new Request('http://localhost', {
    headers: { 'x-forwarded-for': 'invalid<script>alert(1)</script>' },
  });
  assert(getClientIp(mockReqMalformed) === '127.0.0.1', 'getClientIp rejects malicious characters and safely falls back');

  // --- 9. Credential Protection Verification ---
  console.log('\n--- 9. Credential Protection Verification ---');
  assert(!JSON.stringify(login16).includes(redisToken || '___never___'), 'Rate limit results contain ZERO Redis credentials');
  assert(!JSON.stringify(signup11).includes(redisToken || '___never___'), 'Signup results contain ZERO Redis credentials');

  // Cleanup test keys
  await resetRateLimitStore('test-');
  await resetRateLimitStore('http-test-');

  console.log('\n========================================');
  console.log(`Distributed Rate Limiting Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDistributedRateLimiterTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
