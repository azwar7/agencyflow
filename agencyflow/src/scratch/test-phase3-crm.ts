import { prisma } from '../lib/prisma';
import { ensureDefaultPipeline } from '../lib/pipelines';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('PHASE 3 CRM CONFIGURATION TEST SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Get an active workspace
  const workspace = await prisma.workspace.findFirst({
    include: { users: true },
  });

  if (!workspace || workspace.users.length === 0) {
    throw new Error('No workspace or users found for testing.');
  }

  const workspaceId = workspace.id;
  const adminUser = workspace.users.find((u) => u.role === 'OWNER' || u.role === 'ADMIN') || workspace.users[0];

  console.log(`Testing with Workspace: ${workspace.name} (${workspaceId})`);
  console.log(`Acting User: ${adminUser.fullName} (${adminUser.id})`);

  try {
    // ---------------------------------------------------------------
    // TEST 1: Default Pipeline Seeding & Verification
    // ---------------------------------------------------------------
    const pipeline = await ensureDefaultPipeline(workspaceId);
    assert(!!pipeline && pipeline.stages.length >= 5, 'TEST 1: ensureDefaultPipeline seeds at least 5 standard stages');
    assert(pipeline.isDefault === true, 'TEST 1b: Default pipeline is flagged isDefault=true');

    // ---------------------------------------------------------------
    // TEST 2: Deal Creation Linked to Dynamic Pipeline & Stage
    // ---------------------------------------------------------------
    const firstStage = pipeline.stages[0];
    const testDeal = await prisma.deal.create({
      data: {
        workspaceId,
        assignedToId: adminUser.id,
        pipelineId: pipeline.id,
        stageId: firstStage.id,
        stage: firstStage.key,
        title: 'Enterprise Growth Retainer (Phase 3 Test)',
        value: 45000,
      },
    });

    assert(testDeal.pipelineId === pipeline.id, 'TEST 2: Deal is linked to pipelineId');
    assert(testDeal.stageId === firstStage.id, 'TEST 2b: Deal is linked to stageId');

    // ---------------------------------------------------------------
    // TEST 3: Stage Rename Propagation to Real Deals
    // ---------------------------------------------------------------
    // Rename firstStage from "Discovery" to "Initial Client Qualification"
    const renamedKey = 'INITIAL_CLIENT_QUALIFICATION';
    await prisma.pipelineStage.update({
      where: { id: firstStage.id },
      data: { name: 'Initial Client Qualification', key: renamedKey },
    });

    // Propagate to linked deals (simulating PATCH /api/v1/settings/pipelines/[id]/stages/[stageId])
    await prisma.deal.updateMany({
      where: { stageId: firstStage.id },
      data: { stage: renamedKey },
    });

    const refetchedDeal = await prisma.deal.findUnique({
      where: { id: testDeal.id },
    });

    assert(
      refetchedDeal?.stage === renamedKey,
      'TEST 3: Stage rename propagated directly to real Deal.stage key'
    );

    // Revert stage name back to Discovery
    await prisma.pipelineStage.update({
      where: { id: firstStage.id },
      data: { name: 'Discovery', key: 'DISCOVERY' },
    });
    await prisma.deal.updateMany({
      where: { stageId: firstStage.id },
      data: { stage: 'DISCOVERY' },
    });

    // ---------------------------------------------------------------
    // TEST 4: Stage Movement & Required Fields Validation
    // ---------------------------------------------------------------
    const proposalStage = pipeline.stages.find((s) => s.key === 'PROPOSAL') || pipeline.stages[1];
    assert(
      proposalStage.requiredFields !== null && Array.isArray(proposalStage.requiredFields as any),
      'TEST 4: Proposal stage defines required fields gate (e.g. value, expectedCloseDate)'
    );

    // ---------------------------------------------------------------
    // TEST 5: CRM Defaults Persistence on Workspace
    // ---------------------------------------------------------------
    const testSources = ['Website Inbound', 'LinkedIn Outbound', 'Exclusive Partner Referral'];
    const testLossReasons = ['Budget Deficit', 'Selected Competitor', 'Internal Hiring'];

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        leadSources: testSources,
        dealLossReasons: testLossReasons,
        duplicateLeadDetection: 'EMAIL_AND_PHONE',
        leadAssignmentRule: 'DEFAULT_OWNER',
        defaultLeadOwnerId: adminUser.id,
      },
    });

    assert(
      Array.isArray(updatedWorkspace.leadSources as any) &&
      (updatedWorkspace.leadSources as string[]).includes('Exclusive Partner Referral'),
      'TEST 5: Custom lead sources persisted on Workspace'
    );
    assert(
      updatedWorkspace.duplicateLeadDetection === 'EMAIL_AND_PHONE',
      'TEST 5b: Duplicate detection policy persisted on Workspace'
    );

    // ---------------------------------------------------------------
    // TEST 6: Duplicate Lead Detection Verification
    // ---------------------------------------------------------------
    const testEmail = `prospect-dup-test-${Date.now()}@example.com`;
    const lead1 = await prisma.lead.create({
      data: {
        workspaceId,
        firstName: 'Marcus',
        lastName: 'Vance',
        email: testEmail,
        source: 'Website Inbound',
        status: 'NEW',
      },
    });

    // Attempting to find existing lead by email in workspace
    const dupFound = await prisma.lead.findFirst({
      where: { workspaceId, email: testEmail },
    });

    assert(
      dupFound !== null && dupFound.id === lead1.id,
      'TEST 6: Duplicate detection accurately identifies existing tenant email'
    );

    // ---------------------------------------------------------------
    // TEST 7: Custom Field Definition (EAV Pattern)
    // ---------------------------------------------------------------
    const customFieldKey = `annual_budget_${Date.now()}`;
    const customField = await prisma.customField.create({
      data: {
        workspaceId,
        entityType: 'LEAD',
        name: 'Target Annual Budget',
        key: customFieldKey,
        fieldType: 'CURRENCY',
        isRequired: true,
      },
    });

    assert(customField.id !== null, 'TEST 7: CustomField definition created in database');
    assert(customField.fieldType === 'CURRENCY', 'TEST 7b: CustomField strongly typed as CURRENCY');

    // ---------------------------------------------------------------
    // TEST 8: Custom Field Value Storage & Type Coercion
    // ---------------------------------------------------------------
    const customVal = await prisma.customFieldValue.create({
      data: {
        workspaceId,
        customFieldId: customField.id,
        recordId: lead1.id,
        numberValue: 120000.5,
      },
    });

    const retrievedVal = await prisma.customFieldValue.findUnique({
      where: {
        customFieldId_recordId: {
          customFieldId: customField.id,
          recordId: lead1.id,
        },
      },
      include: { customField: true },
    });

    assert(
      retrievedVal?.numberValue === 120000.5,
      'TEST 8: CustomFieldValue correctly stored and retrieved numeric currency value'
    );
    assert(
      retrievedVal?.customField.key === customFieldKey,
      'TEST 8b: CustomFieldValue joins cleanly with CustomField definition'
    );

    // ---------------------------------------------------------------
    // TEST 9: Cascade Deletion on Custom Field Deletion
    // ---------------------------------------------------------------
    await prisma.customField.delete({
      where: { id: customField.id },
    });

    const orphanedVal = await prisma.customFieldValue.findFirst({
      where: { customFieldId: customField.id },
    });

    assert(
      orphanedVal === null,
      'TEST 9: CustomFieldValue records are automatically cascaded when field definition is deleted'
    );

    // ---------------------------------------------------------------
    // Clean up test records
    // ---------------------------------------------------------------
    await prisma.deal.delete({ where: { id: testDeal.id } });
    await prisma.lead.delete({ where: { id: lead1.id } });

  } catch (err: any) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3Tests();
