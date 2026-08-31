process.loadEnvFile('.env');
import { prisma } from '../src/lib/prisma';
import { POST as n8nIntegrationHandler } from '../src/app/api/integrations/n8n/leads/route';
import { POST as scoreLeadHandler } from '../src/app/api/v1/ai/score-lead/route';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function runN8nIntegrationTests() {
  console.log('🚀 Starting AgencyFlow n8n Lead Ingestion & Deduplication Test Suite...\n');

  const validSecret = process.env.N8N_INTEGRATION_SECRET || 'PFGd9F7xr6SUQ5jKSnUj1GrhuF3JR1Cebrrwl_qHyKE';

  // Create isolated test workspaces
  const workspaceA = await prisma.workspace.create({
    data: {
      name: 'Alpha Digital Agency',
      slug: `alpha-agency-n8n-${Date.now()}`,
    },
  });

  const userA = await prisma.user.create({
    data: {
      workspaceId: workspaceA.id,
      email: `rep.alpha-${Date.now()}@agencyflow.test`,
      fullName: 'Alex Alpha',
      role: 'OWNER',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
    },
  });

  const sessionA = await createSession(userA.id);

  const workspaceB = await prisma.workspace.create({
    data: {
      name: 'Beta Media Group',
      slug: `beta-agency-n8n-${Date.now()}`,
    },
  });

  const userB = await prisma.user.create({
    data: {
      workspaceId: workspaceB.id,
      email: `rep.beta-${Date.now()}@agencyflow.test`,
      fullName: 'Brandon Beta',
      role: 'OWNER',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
    },
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: Authentication & Authorization Security
    // -------------------------------------------------------------
    console.log('--- 1. Authentication & Security ---');

    // Missing token
    const noAuthReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Business' }),
    });
    const noAuthRes = await n8nIntegrationHandler(noAuthReq);
    assert(noAuthRes.status === 401, 'Missing authentication rejected with HTTP 401');

    // Invalid token
    const badAuthReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_secret_token_123',
      },
      body: JSON.stringify({ name: 'Test Business' }),
    });
    const badAuthRes = await n8nIntegrationHandler(badAuthReq);
    assert(badAuthRes.status === 401, 'Invalid authentication rejected with HTTP 401');

    // Custom Agencyflow-Auth header support
    const customHeaderReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Agencyflow-Auth': validSecret,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify({ name: 'Header Auth Test Lead' }),
    });
    const customHeaderRes = await n8nIntegrationHandler(customHeaderReq);
    assert(customHeaderRes.status === 201, 'Agencyflow-Auth custom header accepted');

    // -------------------------------------------------------------
    // TEST 2: Zod Payload Validation & Bad Input Quarantine
    // -------------------------------------------------------------
    console.log('\n--- 2. Zod Payload Validation ---');

    // Missing required name
    const badPayloadReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify({
        address: '123 Fake Street',
        website: 'http://example.com',
      }),
    });
    const badPayloadRes = await n8nIntegrationHandler(badPayloadReq);
    assert(badPayloadRes.status === 400, 'Missing company name rejected with HTTP 400');
    const badJson = await badPayloadRes.json();
    assert(badJson.success === false && badJson.error.issues.length > 0, 'Validation errors returned in structured format');

    // -------------------------------------------------------------
    // TEST 3: Ingest Exact Acceptance Sample Lead (The Fitness Culture)
    // -------------------------------------------------------------
    console.log('\n--- 3. Real Sample Lead Ingestion (The Fitness Culture) ---');
    const samplePayload = {
      name: 'The Fitness Culture',
      address: 'Arbab Plaza, Near Shell Filling Station, Jamrud Road, Canal Town Peshawar, 25000, Pakistan',
      website: 'http://www.bodyfuel.pk/',
      number: null,
      score: 8,
      reason: 'Fitness centers often benefit greatly from custom websites and membership or booking automations.',
    };

    const sampleReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify(samplePayload),
    });

    const sampleRes = await n8nIntegrationHandler(sampleReq);
    assert(sampleRes.status === 201, 'Sample lead created with HTTP 201');

    const sampleJson = await sampleRes.json();
    assert(sampleJson.success === true, 'Response indicates success: true');
    assert(sampleJson.created === true, 'Response indicates created: true');
    assert(sampleJson.duplicate === false, 'Response indicates duplicate: false');
    assert(Boolean(sampleJson.leadId), `New lead ID returned (${sampleJson.leadId})`);

    // Verify in database
    const savedLead = await prisma.lead.findUnique({
      where: { id: sampleJson.leadId },
      include: { activities: true },
    });

    assert(savedLead?.workspaceId === workspaceA.id, 'Lead stored in correct Workspace A');
    assert(savedLead?.companyName === 'The Fitness Culture', 'Company name saved properly');
    assert(savedLead?.source === 'n8n', 'Source identified as "n8n"');
    assert(savedLead?.leadScore === 80, `n8n prospect score 8 normalized to 80 (was ${savedLead?.leadScore})`);
    assert(savedLead?.status === 'QUALIFIED', `Lead with high score marked QUALIFIED (status=${savedLead?.status})`);
    assert(Boolean(savedLead?.aiSummary && savedLead.aiSummary.includes('custom websites')), 'Qualification reason stored in aiSummary');
    assert(savedLead?.activities.length === 1, 'Initial Activity timeline record created');
    assert(Boolean(savedLead?.activities[0].content.includes('Peshawar')), 'Activity note contains full physical address');

    // Verify Company record auto-linked
    const savedCompany = await prisma.company.findFirst({
      where: { workspaceId: workspaceA.id, name: 'The Fitness Culture' },
    });
    assert(Boolean(savedCompany), 'Company record automatically created');
    assert(savedCompany?.domain === 'bodyfuel.pk', `Company domain normalized ("${savedCompany?.domain}")`);

    // -------------------------------------------------------------
    // TEST 4: Duplicate Detection (Website / Phone / Company Name)
    // -------------------------------------------------------------
    console.log('\n--- 4. Ordered Duplicate Detection ---');

    // Duplicate 1: Exact resend of identical payload
    const duplicateResendReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify(samplePayload),
    });
    const dup1Res = await n8nIntegrationHandler(duplicateResendReq);
    assert(dup1Res.status === 200, 'Duplicate resend returns HTTP 200');
    const dup1Json = await dup1Res.json();
    assert(dup1Json.created === false, 'Duplicate response created is false');
    assert(dup1Json.duplicate === true, 'Duplicate response duplicate is true');
    assert(dup1Json.leadId === sampleJson.leadId, 'Duplicate returns existing lead ID');

    // Duplicate 2: Deduplication by matching Website URL
    const dupWebsiteReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify({
        name: 'BodyFuel Gym & Fitness', // Different company name
        website: 'https://www.bodyfuel.pk/locations', // Same root domain
      }),
    });
    const dup2Res = await n8nIntegrationHandler(dupWebsiteReq);
    assert(dup2Res.status === 200, 'Website domain duplicate detected');
    const dup2Json = await dup2Res.json();
    assert(dup2Json.duplicate === true, 'Domain match flagged as duplicate');

    // Duplicate 3: Deduplication by matching Phone Number
    // First create a lead with a phone
    const phoneLeadReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify({
        name: 'Unique Logistics Inc',
        number: '+92 300 1234567',
      }),
    });
    const phoneLeadRes = await n8nIntegrationHandler(phoneLeadReq);
    const phoneLeadJson = await phoneLeadRes.json();
    assert(phoneLeadJson.created === true, 'Phone test lead created');

    // Try creating another lead with formatted same phone
    const dupPhoneReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify({
        name: 'Logistics Group PK',
        number: '+92-300-1234567', // Same normalized phone
      }),
    });
    const dupPhoneRes = await n8nIntegrationHandler(dupPhoneReq);
    const dupPhoneJson = await dupPhoneRes.json();
    assert(dupPhoneJson.duplicate === true, 'Phone number duplicate detected');

    // -------------------------------------------------------------
    // TEST 5: Missing Optional Fields Resilience
    // -------------------------------------------------------------
    console.log('\n--- 5. Minimal & Nullish Payload Resilience ---');
    const minimalReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceA.id,
      },
      body: JSON.stringify({
        name: 'Minimal Clean Startup',
        address: null,
        website: null,
        number: null,
        score: null,
        reason: null,
      }),
    });
    const minRes = await n8nIntegrationHandler(minimalReq);
    assert(minRes.status === 201, 'Minimal nullish payload created successfully');
    const minJson = await minRes.json();
    assert(minJson.created === true, 'Minimal lead flagged as created: true');

    // -------------------------------------------------------------
    // TEST 6: Multi-Tenant Isolation
    // -------------------------------------------------------------
    console.log('\n--- 6. Multi-Tenant Data & Workspace Isolation ---');

    // Create lead in Workspace B
    const tenantBReq = new Request('http://localhost:3000/api/integrations/n8n/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validSecret}`,
        'x-workspace-id': workspaceB.id,
      },
      body: JSON.stringify({
        name: 'The Fitness Culture', // Same business name, but in tenant B
        website: 'http://www.bodyfuel.pk/',
      }),
    });
    const tenantBRes = await n8nIntegrationHandler(tenantBReq);
    assert(tenantBRes.status === 201, 'Workspace B independently ingests lead without cross-tenant collision');
    const tenantBJson = await tenantBRes.json();
    assert(tenantBJson.workspace.id === workspaceB.id, 'Workspace B lead assigned to Workspace B');
    assert(tenantBJson.leadId !== sampleJson.leadId, 'Workspace B lead has distinct unique ID');

    // Verify Workspace A query cannot see Workspace B lead
    const leadsInWorkspaceA = await prisma.lead.findMany({
      where: { workspaceId: workspaceA.id },
    });
    const leakFound = leadsInWorkspaceA.some((l) => l.workspaceId === workspaceB.id);
    assert(!leakFound, 'Zero data leakage between Workspace A and Workspace B');

    // -------------------------------------------------------------
    // TEST 7: AI Lead Scoring Compatibility on Ingested Lead
    // -------------------------------------------------------------
    console.log('\n--- 7. Downstream AgencyFlow AI Scoring Compatibility ---');
    const aiScoreReq = new Request('http://localhost:3000/api/v1/ai/score-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE_NAME}=${sessionA.rawToken}`,
      },
      body: JSON.stringify({
        leadId: sampleJson.leadId,
      }),
    });

    const aiScoreRes = await scoreLeadHandler(aiScoreReq);
    assert(aiScoreRes.status === 200, 'Ingested n8n lead scored by AgencyFlow AI pipeline with HTTP 200');
    const aiJson = await aiScoreRes.json();
    assert(aiJson.success === true, 'AI scoring returned success: true');
    assert(typeof aiJson.data.score === 'number' && aiJson.data.score > 0, `AI score updated (${aiJson.data.score})`);

  } finally {
    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n🧹 Cleaning up test database fixtures...');
    await prisma.activity.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } });
    await prisma.company.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } });
    await prisma.session.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.user.deleteMany({ where: { workspaceId: { in: [workspaceA.id, workspaceB.id] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [workspaceA.id, workspaceB.id] } } });
    console.log('  Cleaned up all temporary fixtures.');
  }

  // -------------------------------------------------------------
  // RESULTS SUMMARY
  // -------------------------------------------------------------
  console.log('\n========================================');
  console.log(`n8n Lead Ingestion Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runN8nIntegrationTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
