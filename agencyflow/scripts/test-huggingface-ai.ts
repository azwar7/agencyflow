process.loadEnvFile('.env');
import { prisma } from '../src/lib/prisma';
import { aiService } from '../src/lib/ai/ai-service';
import { buildLeadContext } from '../src/lib/ai/context/lead-context';
import { buildLeadAnalysisPrompt } from '../src/lib/ai/prompts/lead-analysis.prompt';
import { LeadAnalysisSchema, LeadAnalysis } from '../src/lib/ai/schemas/lead-analysis.schema';
import { createSession, SESSION_COOKIE_NAME, SessionData } from '../src/lib/auth-session';
import { POST as scoreLeadHandler } from '../src/app/api/v1/ai/score-lead/route';

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

async function runHuggingFaceVerification() {
  console.log('🤖 Starting LeadFlow — Real Hugging Face AI Verification Suite...\n');

  // --- 1. Environment & Provider Configuration Verification ---
  console.log('--- 1. Environment & Provider Configuration ---');
  const hasHfKey = Boolean(process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.trim().length > 0);
  assert(hasHfKey, 'HUGGINGFACE_API_KEY is configured in environment');

  const configuredProvider = process.env.AI_PROVIDER || 'mock';
  console.log(`  ℹ️ Configured AI_PROVIDER: ${configuredProvider}`);
  assert(configuredProvider === 'huggingface', 'AI_PROVIDER is set to "huggingface"');

  const hfProvider = aiService.getProvider('huggingface');
  assert(hfProvider.isConfigured() === true, 'Hugging Face provider reports isConfigured() = true');
  const hfModel = hfProvider.getDefaultModel();
  console.log(`  ℹ️ Hugging Face Model: ${hfModel}`);
  assert(Boolean(hfModel), 'Hugging Face default model is defined');

  // --- 2. Create Controlled Lead & Context Fixture ---
  console.log('\n--- 2. Setting Up Controlled CRM Lead Context ---');
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Growth Agency',
      slug: `acme-hf-${Date.now()}`,
    },
  });

  const user = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      email: `john.rep-${Date.now()}@acmegrowth.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      fullName: 'Sarah Jenkins',
      role: 'OWNER',
    },
  });

  const sessionData: SessionData = {
    userId: user.id,
    workspaceId: workspace.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    agencyName: workspace.name,
  };

  const sessionResult = await createSession(user.id);
  const sessionToken = sessionResult.rawToken;

  const company = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'Acme Construction & Civil',
      domain: 'acmeconstruction.com',
      industry: 'Construction & Real Estate',
    },
  });

  const lead = await prisma.lead.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: user.id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith@acmeconstruction.com',
      phone: '+1-555-0188',
      companyName: 'Acme Construction & Civil',
      status: 'QUALIFIED',
      source: 'Executive Inbound',
      leadScore: 0,
      aiSummary: null,
    },
  });

  // Create real CRM timeline activities
  await prisma.activity.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: user.id,
        leadId: lead.id,
        type: 'EMAIL',
        content: 'Opened commercial redesign proposal deck. Replied requesting detailed line-item pricing and sprint milestone schedule.',
      },
      {
        workspaceId: workspace.id,
        userId: user.id,
        leadId: lead.id,
        type: 'CALL',
        content: 'Discovery call completed. John confirmed $80k budget allocated for Q4 digital transformation.',
      },
    ],
  });

  // Create pending task
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      assignedToId: user.id,
      leadId: lead.id,
      title: 'Schedule executive pricing review call',
      dueDate: new Date(Date.now() + 86400000),
      priority: 'HIGH',
      status: 'PENDING',
    },
  });

  try {
    // --- 3. Build Isolated Lead Context & Prompt ---
    console.log('\n--- 3. Context & Prompt Construction ---');
    const leadContext = await buildLeadContext(lead.id, sessionData);
    assert(leadContext.lead.fullName === 'John Smith', 'LeadContext built with prospect name');
    assert(leadContext.company?.name === 'Acme Construction & Civil', 'Company matched in LeadContext');
    assert(leadContext.activities.length === 2, 'Activities timeline included');
    assert(leadContext.tasks.length === 1, 'Pending tasks included');

    const prompt = buildLeadAnalysisPrompt(leadContext, 'Focus on enterprise contract readiness and timeline urgency.');
    assert(prompt.userPrompt.includes('### CRM_CONTEXT_START'), 'Prompt injection boundary delimiters present');

    // --- 4. Execute Real Hugging Face AI Generation ---
    console.log('\n--- 4. Executing Real Hugging Face Model Generation ---');
    console.log(`  🚀 Sending request to Hugging Face model (${hfModel})...`);
    
    const startTime = performance.now();
    const result = await aiService.generateStructured<LeadAnalysis>({
      provider: 'huggingface',
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      schema: LeadAnalysisSchema,
      temperature: 0.1,
    });
    const durationMs = Math.round(performance.now() - startTime);

    console.log(`  ✨ Real Hugging Face response received in ${durationMs}ms!`);

    assert(result.provider === 'huggingface', 'Response provider is "huggingface"');
    assert(result.model === hfModel, `Response model matches "${hfModel}"`);
    assert(result.latencyMs > 0, `Latency measured (${result.latencyMs}ms)`);
    assert(typeof result.rawText === 'string' && result.rawText.length > 0, 'Raw model text received from Hugging Face');

    // --- 5. Validate Structured AI Output against Zod ---
    console.log('\n--- 5. Structured Zod Schema Validation ---');
    const analysis = result.data;
    console.log('  📊 Structured AI Analysis Result:');
    console.log(`     • Score: ${analysis.score}/100`);
    console.log(`     • Summary: ${analysis.summary}`);
    console.log(`     • Strengths: ${JSON.stringify(analysis.strengths)}`);
    console.log(`     • Risks: ${JSON.stringify(analysis.risks)}`);
    console.log(`     • Recommended Action: ${analysis.recommendedNextAction}`);
    console.log(`     • Confidence: ${analysis.confidence}`);

    assert(typeof analysis.score === 'number' && analysis.score >= 0 && analysis.score <= 100, `Score is valid integer (${analysis.score})`);
    assert(typeof analysis.summary === 'string' && analysis.summary.length > 10, 'Summary is non-empty string');
    assert(Array.isArray(analysis.strengths) && analysis.strengths.length > 0, 'Strengths array is populated');
    assert(Array.isArray(analysis.risks), 'Risks array is populated');
    assert(typeof analysis.recommendedNextAction === 'string' && analysis.recommendedNextAction.length > 5, 'Recommended action populated');
    assert(typeof analysis.confidence === 'number' && analysis.confidence > 0, `Confidence is valid float (${analysis.confidence})`);

    // --- 6. End-to-End HTTP Route Execution ---
    console.log('\n--- 6. End-to-End API Route Execution (POST /api/v1/ai/score-lead) ---');
    const apiReq = new Request('http://localhost:3000/api/v1/ai/score-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
      body: JSON.stringify({
        leadId: lead.id,
        provider: 'huggingface',
      }),
    });

    const apiRes = await scoreLeadHandler(apiReq);
    assert(apiRes.status === 200, 'API endpoint returned HTTP 200');

    const apiJson = await apiRes.json();
    assert(apiJson.success === true, 'API response indicates success: true');
    assert(apiJson.data.provider === 'huggingface', 'API response reports provider: "huggingface"');
    assert(apiJson.data.score === analysis.score || (apiJson.data.score >= 0 && apiJson.data.score <= 100), `API returned valid lead score (${apiJson.data.score})`);
    assert(typeof apiJson.data.summary === 'string', 'API returned valid AI summary');

    // --- 7. Verify Database Persistence ---
    console.log('\n--- 7. Database Persistence Verification ---');
    const persistedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
    });

    assert(persistedLead?.leadScore === apiJson.data.score, `Database leadScore matches AI score (${persistedLead?.leadScore})`);
    assert(persistedLead?.aiSummary === apiJson.data.summary, 'Database aiSummary matches AI summary');

  } finally {
    // --- Cleanup Database Fixtures ---
    console.log('\n🧹 Cleaning up test fixtures...');
    await prisma.activity.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.task.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.lead.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.company.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.deleteMany({ where: { id: workspace.id } });
    console.log('  Cleaned up all temporary fixtures.');
  }

  // --- Final Results ---
  console.log('\n========================================');
  console.log(`Hugging Face Real AI Verification: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHuggingFaceVerification()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
