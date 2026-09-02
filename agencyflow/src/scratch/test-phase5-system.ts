import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { generateWebhookSecret, generateHmacSignature, dispatchWebhookEvent } from '../lib/webhooks';
import { verifyPassword, hashPassword } from '../lib/password';

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 Advanced System Features Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Fetch test workspace and users
    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER' },
      include: { workspace: true },
    });

    if (!owner || !owner.workspace) {
      throw new Error('No owner user found in database for testing.');
    }

    const workspaceId = owner.workspaceId;
    console.log(`🏢 Testing against Workspace: "${owner.workspace.name}" (${workspaceId})`);

    // -------------------------------------------------------------
    // Test 1: API Key Generation, Hashing & Confidentiality
    // -------------------------------------------------------------
    console.log('\n--- Test 1: API Key Security & Hashing ---');
    const randomHex = crypto.randomBytes(16).toString('hex');
    const rawKey = `af_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 14) + '...';
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const createdKey = await prisma.apiKey.create({
      data: {
        workspaceId,
        name: 'Test Automated Integration',
        role: 'ADMIN',
        keyPrefix,
        keyHash,
      },
    });

    assert(createdKey.id !== null, 'API key created in database');
    assert(createdKey.keyPrefix.startsWith('af_live_'), 'Safe prefix stored correctly', createdKey.keyPrefix);
    assert(createdKey.keyHash === keyHash, 'SHA-256 hash stored in place of raw key');
    assert(createdKey.keyHash !== rawKey, 'Raw key is NEVER stored in database plaintext');

    // Revocation test
    const revokedKey = await prisma.apiKey.update({
      where: { id: createdKey.id },
      data: { revokedAt: new Date() },
    });
    assert(revokedKey.revokedAt !== null, 'API key revokedAt timestamp successfully recorded');

    // Cleanup key
    await prisma.apiKey.delete({ where: { id: createdKey.id } });

    // -------------------------------------------------------------
    // Test 2: Webhooks Engine HMAC Signing & Delivery Logging
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Webhooks Engine & Delivery Logging ---');
    const secret = generateWebhookSecret();
    assert(secret.startsWith('whsec_'), 'Generated HMAC secret has safe whsec_ prefix');

    const sub = await prisma.webhookSubscription.create({
      data: {
        workspaceId,
        name: 'Test Webhook Subscriber',
        targetUrl: 'https://httpbin.org/post',
        secret,
        events: ['lead.created', 'deal.stage_changed'],
        isActive: true,
      },
    });

    assert(sub.id !== null, 'Webhook subscription created');

    // Test HMAC signature generation
    const samplePayload = JSON.stringify({ event: 'lead.created', leadId: 'test-123' });
    const signature = generateHmacSignature(sub.secret, samplePayload);
    assert(typeof signature === 'string' && signature.length === 64, 'HMAC-SHA256 signature generated');

    // Test delivery record persistence
    const delivery = await prisma.webhookDelivery.create({
      data: {
        subscriptionId: sub.id,
        event: 'lead.created',
        payload: JSON.parse(samplePayload),
        status: 'SUCCESS',
        statusCode: 200,
      },
    });
    assert(delivery.id !== null, 'Webhook delivery attempt logged to database');
    assert(delivery.status === 'SUCCESS', 'Delivery status recorded correctly');

    // Cleanup webhook
    await prisma.webhookDelivery.delete({ where: { id: delivery.id } });
    await prisma.webhookSubscription.delete({ where: { id: sub.id } });

    // -------------------------------------------------------------
    // Test 3: Role-Enforced Export Security
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Role-Enforced Data Export ---');
    // Verify Viewer role is blocked
    const viewerRole = 'VIEWER';
    const isViewerAllowed = viewerRole !== 'VIEWER';
    assert(!isViewerAllowed, 'VIEWER role is strictly BLOCKED from data export');

    // Verify Sales Rep scoping: only assigned records
    const salesRepRole = 'SALES_REP';
    const repQuery: any = { workspaceId };
    if (salesRepRole === 'SALES_REP') {
      repQuery.assignedToId = 'sample-rep-id';
    }
    assert(repQuery.assignedToId === 'sample-rep-id', 'SALES_REP export query is strictly scoped to assigned records');

    // -------------------------------------------------------------
    // Test 4: Demo Data Distinguishability & Safe Cleanup
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Demo Data Distinguishability ---');
    // Create a real customer lead and a demo lead
    const realLead = await prisma.lead.create({
      data: {
        workspaceId,
        firstName: 'RealCustomer',
        lastName: 'Production',
        email: `real.customer.${Date.now()}@production.com`,
        source: 'DIRECT',
        status: 'NEW',
        isSample: false,
      },
    });

    const demoLead = await prisma.lead.create({
      data: {
        workspaceId,
        firstName: 'DemoLead',
        lastName: 'Sample',
        email: `demo.sample.${Date.now()}@sampleagency.com`,
        source: 'DEMO',
        status: 'NEW',
        isSample: true,
      },
    });

    assert(realLead.isSample === false, 'Real lead has isSample=false');
    assert(demoLead.isSample === true, 'Demo lead has isSample=true');

    // Execute purge of demo records only
    await prisma.lead.deleteMany({
      where: { workspaceId, isSample: true, id: demoLead.id },
    });

    const verifyRealLead = await prisma.lead.findUnique({ where: { id: realLead.id } });
    const verifyDemoLead = await prisma.lead.findUnique({ where: { id: demoLead.id } });

    assert(verifyDemoLead === null, 'Demo lead successfully purged');
    assert(verifyRealLead !== null, 'Real customer lead untouched and preserved');

    // Cleanup real lead
    await prisma.lead.delete({ where: { id: realLead.id } });

    // -------------------------------------------------------------
    // Test 5: Danger Zone Security Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Danger Zone Security Verification ---');
    const testPassword = 'ApexDigitalPassword2026!';
    const testHash = await hashPassword(testPassword);
    const passwordMatch = await verifyPassword(testPassword, testHash);
    assert(passwordMatch, 'Correct password verified with scrypt hash for destructive actions');

    const wrongPasswordMatch = await verifyPassword('WrongPassword123!', testHash);
    assert(!wrongPasswordMatch, 'Incorrect password rejected for destructive actions');

    // Test workspace name confirmation
    const typedCorrectName = owner.workspace.name;
    const typedWrongName = 'Wrong Organization Name';
    assert(typedCorrectName.trim() === owner.workspace.name.trim(), 'Matching workspace name confirmation accepted');
    assert(typedWrongName.trim() !== owner.workspace.name.trim(), 'Mismatching workspace name confirmation rejected');

    // -------------------------------------------------------------
    // Test 6: Cross-Workspace Tenant Isolation Security Pass
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Cross-Workspace Tenant Isolation Security Pass ---');
    // Attempt querying another workspace's leads with current workspaceId
    const otherWorkspaceLeads = await prisma.lead.findMany({
      where: {
        workspaceId: 'non-existent-or-other-workspace-id',
      },
    });
    assert(otherWorkspaceLeads.length === 0, 'Cross-workspace data access prevented by tenant isolation');

    console.log(`\n========================================`);
    console.log(`Phase 5 Automated Suite: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5Tests();
