import { prisma } from '../src/lib/prisma';
import { encodeSession, SESSION_COOKIE_NAME, AUTH_COOKIE_NAME } from '../src/lib/auth-session';

async function runChecklistCompletionTest() {
  console.log('🧪 Starting Onboarding Checklist Completion & Dynamic State Test...\n');

  try {
    const timestamp = Date.now();
    const email = `checklist_tester_${timestamp}@agencytest.io`;

    // 1. Sign up new account
    console.log('1️⃣ Creating fresh test workspace...');
    const signupRes = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Checklist Tester',
        email,
        password: 'Password123!',
        agencyName: 'Milestone Agency',
      }),
    });
    const signupJson = await signupRes.json();
    if (!signupRes.ok || !signupJson.success) {
      throw new Error(`Signup failed: ${JSON.stringify(signupJson)}`);
    }

    const wsId = signupJson.data.workspace.id;
    const userId = signupJson.data.user.id;
    const token = encodeSession({
      userId,
      workspaceId: wsId,
      email,
      fullName: 'Checklist Tester',
      role: 'OWNER',
      agencyName: 'Milestone Agency',
    });
    const headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${token}; ${AUTH_COOKIE_NAME}=true`,
      'x-workspace-id': wsId,
    };

    // 2. Initial state: verify 0% progress (all 4 false)
    console.log('2️⃣ Verifying initial 0% checklist state...');
    const meRes1 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson1 = await meRes1.json();
    const cl1 = meJson1.data.workspace.checklist;
    console.log('   Initial Checklist:', cl1);
    if (cl1.hasClient || cl1.hasDealOrLead || cl1.hasDeliverableOrProject || cl1.hasTask) {
      throw new Error(`❌ Initial checklist should be all false! Got: ${JSON.stringify(cl1)}`);
    }
    console.log('   ✅ Initial state is 0% (all false).');

    // 3. Step 1: Add a client -> 25%
    console.log('3️⃣ Creating first client...');
    const clientRes = await fetch('http://localhost:3000/api/v1/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        name: 'Milestone Corp',
        domain: 'milestone.com',
        industry: 'FinTech',
        contactName: 'Alice Green',
        contactEmail: 'alice@milestone.com',
      }),
    });
    const clientJson = await clientRes.json();
    if (!clientRes.ok || !clientJson.success) {
      throw new Error(`Failed to create client: ${JSON.stringify(clientJson)}`);
    }

    const meRes2 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson2 = await meRes2.json();
    const cl2 = meJson2.data.workspace.checklist;
    console.log('   Checklist after adding client:', cl2);
    if (!cl2.hasClient) {
      throw new Error(`❌ hasClient should be true!`);
    }
    console.log('   ✅ "Add your first client" completed (25% progress).');

    // 4. Step 2: Create a deal or lead -> 50%
    console.log('4️⃣ Creating first pipeline deal...');
    const dealRes = await fetch('http://localhost:3000/api/v1/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        title: 'Q3 Growth Marketing Retainer',
        value: '25000',
        stage: 'DISCOVERY',
      }),
    });
    const dealJson = await dealRes.json();
    if (!dealRes.ok || !dealJson.success) {
      throw new Error(`Failed to create deal: ${JSON.stringify(dealJson)}`);
    }

    const meRes3 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson3 = await meRes3.json();
    const cl3 = meJson3.data.workspace.checklist;
    console.log('   Checklist after adding deal:', cl3);
    if (!cl3.hasDealOrLead) {
      throw new Error(`❌ hasDealOrLead should be true!`);
    }
    console.log('   ✅ "Create a pipeline deal or lead" completed (50% progress).');

    // 5. Step 3: Upload deliverable or project -> 75%
    console.log('5️⃣ Uploading first deliverable...');
    const delivRes = await fetch('http://localhost:3000/api/v1/deliverables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        title: 'Brand System Final Deliverable',
        fileName: 'Brand_System.pdf',
        fileType: 'pdf',
      }),
    });
    const delivJson = await delivRes.json();
    if (!delivRes.ok || !delivJson.success) {
      throw new Error(`Failed to create deliverable: ${JSON.stringify(delivJson)}`);
    }

    const meRes4 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson4 = await meRes4.json();
    const cl4 = meJson4.data.workspace.checklist;
    console.log('   Checklist after uploading deliverable:', cl4);
    if (!cl4.hasDeliverableOrProject) {
      throw new Error(`❌ hasDeliverableOrProject should be true!`);
    }
    console.log('   ✅ "Upload a deliverable or project" completed (75% progress).');

    // 6. Step 4: Create a task -> 100%
    console.log('6️⃣ Creating first task...');
    const taskRes = await fetch('http://localhost:3000/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        title: 'Onboarding sync with client stakeholders',
        priority: 'HIGH',
        dueDate: new Date().toISOString(),
      }),
    });
    const taskJson = await taskRes.json();
    if (!taskRes.ok || !taskJson.success) {
      throw new Error(`Failed to create task: ${JSON.stringify(taskJson)}`);
    }

    const meRes5 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson5 = await meRes5.json();
    const cl5 = meJson5.data.workspace.checklist;
    console.log('   Checklist after creating task:', cl5);
    if (!cl5.hasTask || !cl5.hasClient || !cl5.hasDealOrLead || !cl5.hasDeliverableOrProject) {
      throw new Error(`❌ All 4 items should be true! Got: ${JSON.stringify(cl5)}`);
    }
    console.log('   ✅ "Create an urgent task or action" completed (100% progress).');

    console.log('\n🎉 ALL ONBOARDING CHECKLIST MILESTONES PASSED 100% PERFECTLY! 🎉\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runChecklistCompletionTest();
