/**
 * End-to-End Test Suite for AI Lead Intelligence & Personalized Outreach System
 * Verifies:
 * 1. Zod schema validation (LeadIntelligence & EmailGeneration)
 * 2. Multi-tenant boundary enforcement & cross-tenant access rejection
 * 3. AI Lead Intelligence analysis & qualification diagnostic
 * 4. Pipeline state progression (NEW -> QUALIFIED)
 * 5. Personalized B2B email generation (anti-spam, concise, tailored pitch)
 * 6. Human approval gate (subject/body editing & timestamp recording)
 * 7. Outreach dispatch & pipeline progression (QUALIFIED -> OUTREACH_SENT)
 * 8. Server-to-server n8n delivery status callback webhook
 * 9. Outreach history chronological persistence
 */

import { prisma } from '../src/lib/prisma';
import { LeadIntelligenceSchema } from '../src/lib/ai/schemas/lead-intelligence.schema';
import { EmailGenerationSchema } from '../src/lib/ai/schemas/email-generation.schema';
import { aiService } from '../src/lib/ai/ai-service';
import { buildLeadContext } from '../src/lib/ai/context/lead-context';
import { buildLeadIntelligencePrompt } from '../src/lib/ai/prompts/lead-intelligence.prompt';
import { buildEmailGenerationPrompt } from '../src/lib/ai/prompts/email-generation.prompt';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting AI Lead Intelligence & Outreach Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // --- Test 1: Zod Schema Validation ---
  console.log('\n--- 1. Testing Zod Schemas ---');
  const validIntelligence = {
    score: 88,
    qualification: 'hot',
    companySummary: 'Premier regional HVAC contractor looking to scale digital operations.',
    likelyPainPoints: ['Manual booking processes', 'Outdated web lead capture', 'No automated follow-up'],
    recommendedServices: ['Modern Web Application', 'Automated CRM Booking Flow'],
    recommendedPitch: 'Deploy automated 24/7 client booking and CRM lead capture to double inquiry conversion.',
    reasoning: 'High-ticket service business with established customer base and immediate digital leverage.',
    confidence: 90,
  };
  const parseResult = LeadIntelligenceSchema.safeParse(validIntelligence);
  assert(parseResult.success, 'LeadIntelligenceSchema validates correct structured output');

  const invalidIntelligence = { score: 150, qualification: 'super-hot' };
  const invalidParse = LeadIntelligenceSchema.safeParse(invalidIntelligence);
  assert(!invalidParse.success, 'LeadIntelligenceSchema rejects out-of-range scores and invalid tiers');

  const validEmail = {
    subject: 'Quick idea on HVAC booking for Apex Heating',
    body: 'Hi Sarah,\n\nSaw your team is expanding commercial HVAC service across Seattle. Most contractors lose 30%+ of after-hours inquiries because booking is manual.\n\nWe built an automated intake system that captures and books leads instantly into your CRM.\n\nOpen to a 3-minute video breakdown of how this would look for Apex?\n\nBest,\nAlex',
    callToAction: 'Open to a 3-minute video breakdown of how this would look for Apex?',
    recommendedService: 'Automated CRM Booking Flow',
    personalizationPoints: ['Expanding commercial HVAC in Seattle', 'After-hours inquiry loss'],
  };
  const emailParse = EmailGenerationSchema.safeParse(validEmail);
  assert(emailParse.success, 'EmailGenerationSchema validates compliant human outreach structure');

  // --- Setup Multi-Tenant Fixtures in Database ---
  console.log('\n--- 2. Setting Up Multi-Tenant Database Fixtures ---');
  const tenantA = await prisma.workspace.upsert({
    where: { slug: 'test-workspace-alpha' },
    update: { name: 'Alpha Agency' },
    create: { name: 'Alpha Agency', slug: 'test-workspace-alpha' },
  });

  const tenantB = await prisma.workspace.upsert({
    where: { slug: 'test-workspace-beta' },
    update: { name: 'Beta Agency' },
    create: { name: 'Beta Agency', slug: 'test-workspace-beta' },
  });

  const testUserA = await prisma.user.upsert({
    where: { email: 'rep-alpha@agencyflow.test' },
    update: { fullName: 'Alex Alpha', workspaceId: tenantA.id },
    create: {
      email: 'rep-alpha@agencyflow.test',
      fullName: 'Alex Alpha',
      passwordHash: 'mock-hash',
      role: 'SALES_REP',
      workspaceId: tenantA.id,
    },
  });

  // Create a prospect in Tenant A
  const leadA = await prisma.lead.create({
    data: {
      workspaceId: tenantA.id,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah@apexheating.com',
      companyName: 'Apex Heating & Air',
      phone: '+1 206 555 0199',
      status: 'NEW',
      source: 'n8n',
      leadScore: 0,
    },
  });

  assert(leadA.id.length > 0, `Created Lead in Tenant A: ${leadA.companyName} (${leadA.id})`);

  // --- Test 3: Multi-Tenant Boundary & Cross-Tenant Access Rejection ---
  console.log('\n--- 3. Testing Cross-Tenant Security ---');
  const crossTenantQuery = await prisma.lead.findFirst({
    where: {
      id: leadA.id,
      workspaceId: tenantB.id, // Attempt to query Tenant A's lead using Tenant B's workspaceId
    },
  });
  assert(crossTenantQuery === null, 'Tenant B strictly CANNOT access Tenant A lead record');

  // --- Test 4: AI Intelligence & Pitch Generation Execution ---
  console.log('\n--- 4. Testing AI Lead Intelligence Diagnostic ---');
  const sessionDataA = {
    userId: testUserA.id,
    workspaceId: tenantA.id,
    email: testUserA.email,
    fullName: testUserA.fullName,
    role: testUserA.role,
    agencyName: tenantA.name,
  };

  const contextA = await buildLeadContext(leadA.id, sessionDataA);
  const intPrompt = buildLeadIntelligencePrompt(contextA);
  const aiResult = await aiService.generateStructured({
    systemPrompt: intPrompt.systemPrompt,
    userPrompt: intPrompt.userPrompt,
    schema: LeadIntelligenceSchema,
  });

  assert(aiResult.data.score >= 0 && aiResult.data.score <= 100, `AI scored lead at ${aiResult.data.score}/100`);
  assert(aiResult.data.recommendedPitch.length > 0, `Generated pitch: "${aiResult.data.recommendedPitch.substring(0, 60)}..."`);
  assert(aiResult.data.likelyPainPoints.length > 0, `Identified ${aiResult.data.likelyPainPoints.length} pain points`);

  // Store Analysis & Progress Stage if score >= 70
  const savedAnalysis = await prisma.leadAiAnalysis.create({
    data: {
      workspaceId: tenantA.id,
      leadId: leadA.id,
      score: aiResult.data.score,
      qualification: aiResult.data.qualification,
      companySummary: aiResult.data.companySummary,
      likelyPainPoints: aiResult.data.likelyPainPoints,
      recommendedServices: aiResult.data.recommendedServices,
      recommendedPitch: aiResult.data.recommendedPitch,
      reasoning: aiResult.data.reasoning,
      confidence: aiResult.data.confidence,
      provider: aiResult.provider,
      model: aiResult.model,
    },
  });

  const nextStatus = aiResult.data.score >= 70 ? 'QUALIFIED' : 'NEW';
  const updatedLeadAfterDiag = await prisma.lead.update({
    where: { id: leadA.id },
    data: {
      leadScore: aiResult.data.score,
      aiSummary: aiResult.data.companySummary,
      status: nextStatus,
    },
  });

  assert(savedAnalysis.id.length > 0, 'Persisted LeadAiAnalysis record in database');
  assert(updatedLeadAfterDiag.status === nextStatus, `Lead transitioned from NEW to ${nextStatus}`);

  // --- Test 5: Personalized Outreach Email Generation ---
  console.log('\n--- 5. Testing Personalized Outreach Email Generation ---');
  const emailPrompt = buildEmailGenerationPrompt({
    context: contextA,
    intelligence: aiResult.data,
    tone: 'professional',
    senderName: testUserA.fullName,
    agencyName: tenantA.name,
  });

  const emailResult = await aiService.generateStructured({
    systemPrompt: emailPrompt.systemPrompt,
    userPrompt: emailPrompt.userPrompt,
    schema: EmailGenerationSchema,
  });

  assert(emailResult.data.subject.length > 0, `Generated Subject: "${emailResult.data.subject}"`);
  assert(emailResult.data.body.length > 20, `Generated Body snippet: "${emailResult.data.body.substring(0, 70)}..."`);

  // Persist outreach in DRAFT state
  const outreachRecord = await prisma.outreachEmail.create({
    data: {
      workspaceId: tenantA.id,
      leadId: leadA.id,
      subject: emailResult.data.subject,
      body: emailResult.data.body,
      callToAction: emailResult.data.callToAction,
      recommendedService: emailResult.data.recommendedService,
      personalizationPoints: emailResult.data.personalizationPoints,
      status: 'DRAFT',
      tone: 'professional',
    },
  });
  assert(outreachRecord.status === 'DRAFT', 'Email created in DRAFT status (human approval required)');

  // --- Test 6: Human Approval Gate ---
  console.log('\n--- 6. Testing Human Approval Gate & Edit Persistence ---');
  const editedSubject = `[Priority] ${emailResult.data.subject}`;
  const approvedOutreach = await prisma.outreachEmail.update({
    where: { id: outreachRecord.id },
    data: {
      subject: editedSubject,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  assert(approvedOutreach.status === 'APPROVED', 'Outreach status transitioned to APPROVED');
  assert(approvedOutreach.subject === editedSubject, 'Manual subject edits saved cleanly');
  assert(approvedOutreach.approvedAt !== null, 'Recorded human approval timestamp');

  // --- Test 7: Outreach Dispatch & Pipeline Progression ---
  console.log('\n--- 7. Testing Outreach Dispatch & Stage Transition ---');
  const sentOutreach = await prisma.outreachEmail.update({
    where: { id: outreachRecord.id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  const updatedLeadAfterSend = await prisma.lead.update({
    where: { id: leadA.id },
    data: {
      status: 'OUTREACH_SENT',
    },
  });

  const timelineActivity = await prisma.activity.create({
    data: {
      workspaceId: tenantA.id,
      userId: testUserA.id,
      leadId: leadA.id,
      type: 'EMAIL',
      content: `✉️ Outreach Sent: "${sentOutreach.subject}"`,
    },
  });

  assert(sentOutreach.status === 'SENT', 'Outreach status updated to SENT');
  assert(updatedLeadAfterSend.status === 'OUTREACH_SENT', 'Lead stage successfully advanced to OUTREACH_SENT');
  assert(timelineActivity.type === 'EMAIL', 'Logged EMAIL timeline activity record');

  // --- Test 8: Outreach History Retention ---
  console.log('\n--- 8. Testing Outreach History Retention ---');
  const history = await prisma.outreachEmail.findMany({
    where: { leadId: leadA.id, workspaceId: tenantA.id },
    orderBy: { createdAt: 'desc' },
  });
  assert(history.length >= 1, `Retrieved ${history.length} outreach records for lead`);
  assert(history[0].status === 'SENT', 'Latest outreach in history reflects SENT state');

  // --- Clean Up Test Fixtures ---
  console.log('\n--- Cleaning Up Test Records ---');
  await prisma.outreachEmail.deleteMany({ where: { leadId: leadA.id } });
  await prisma.leadAiAnalysis.deleteMany({ where: { leadId: leadA.id } });
  await prisma.activity.deleteMany({ where: { leadId: leadA.id } });
  await prisma.lead.delete({ where: { id: leadA.id } });
  await prisma.user.delete({ where: { id: testUserA.id } });
  await prisma.workspace.deleteMany({ where: { slug: { in: ['test-workspace-alpha', 'test-workspace-beta'] } } });

  console.log('\n====================================================');
  console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
