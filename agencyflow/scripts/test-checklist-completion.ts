import { prisma } from '../src/lib/prisma';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/auth-session';

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
    const { rawToken } = await createSession(userId);

    const headers = {
      Cookie: `${SESSION_COOKIE_NAME}=${rawToken}`,
    };

    // 2. Initial state check (brand new workspace -> all false)
    console.log('2️⃣ Verifying initial state: all 4 checklist items should be false...');
    const meRes1 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson1 = await meRes1.json();
    console.log('Initial checklist status:', meJson1.data.workspace.checklist);

    if (
      meJson1.data.workspace.checklist.hasClient ||
      meJson1.data.workspace.checklist.hasDealOrLead ||
      meJson1.data.workspace.checklist.hasDeliverableOrProject ||
      meJson1.data.workspace.checklist.hasTask
    ) {
      throw new Error('Initial checklist was not all false!');
    }
    console.log('✅ Initial checklist verified at 0%.\n');

    // 3. Step 1: Add a Client (Company)
    console.log('3️⃣ Step 1: Adding a Client Company...');
    await prisma.company.create({
      data: {
        workspaceId: wsId,
        name: 'First Enterprise Client Corp',
      },
    });

    const meRes2 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson2 = await meRes2.json();
    console.log('After adding client:', meJson2.data.workspace.checklist);
    if (!meJson2.data.workspace.checklist.hasClient) {
      throw new Error('hasClient did not turn true after adding client!');
    }
    console.log('✅ Step 1 (hasClient) verified.\n');

    // 4. Step 2: Add a Lead or Deal
    console.log('4️⃣ Step 2: Adding a Deal...');
    await prisma.deal.create({
      data: {
        workspaceId: wsId,
        title: 'Q3 Enterprise CRM Strategy Retainer',
        value: 45000,
        stage: 'DISCOVERY',
      },
    });

    const meRes3 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson3 = await meRes3.json();
    console.log('After adding deal:', meJson3.data.workspace.checklist);
    if (!meJson3.data.workspace.checklist.hasDealOrLead) {
      throw new Error('hasDealOrLead did not turn true after adding deal!');
    }
    console.log('✅ Step 2 (hasDealOrLead) verified.\n');

    // 5. Step 3: Add a Deliverable or Project
    console.log('5️⃣ Step 3: Adding a Project...');
    await prisma.project.create({
      data: {
        workspaceId: wsId,
        title: 'CRM Architecture & Implementation',
        budget: 45000,
        status: 'ON TRACK',
      },
    });

    const meRes4 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson4 = await meRes4.json();
    console.log('After adding project:', meJson4.data.workspace.checklist);
    if (!meJson4.data.workspace.checklist.hasDeliverableOrProject) {
      throw new Error('hasDeliverableOrProject did not turn true after adding project!');
    }
    console.log('✅ Step 3 (hasDeliverableOrProject) verified.\n');

    // 6. Step 4: Add a Task
    console.log('6️⃣ Step 4: Adding a Task...');
    await prisma.task.create({
      data: {
        workspaceId: wsId,
        assignedToId: userId,
        title: 'Conduct architecture review with client stakeholders',
        dueDate: new Date(Date.now() + 86400000 * 2),
      },
    });

    const meRes5 = await fetch('http://localhost:3000/api/v1/auth/me', { headers });
    const meJson5 = await meRes5.json();
    console.log('After adding task:', meJson5.data.workspace.checklist);
    if (!meJson5.data.workspace.checklist.hasTask) {
      throw new Error('hasTask did not turn true after adding task!');
    }
    console.log('✅ Step 4 (hasTask) verified.\n');

    // 7. Summary
    console.log('🎉 ALL 4 CHECKLIST ITEMS SUCCESSFULLY TRACKED AND COMPLETED (100%)!');
    console.log('Final Checklist Payload:', JSON.stringify(meJson5.data.workspace.checklist, null, 2));

    // Cleanup
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.task.deleteMany({ where: { workspaceId: wsId } });
    await prisma.project.deleteMany({ where: { workspaceId: wsId } });
    await prisma.deal.deleteMany({ where: { workspaceId: wsId } });
    await prisma.company.deleteMany({ where: { workspaceId: wsId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.workspace.deleteMany({ where: { id: wsId } });
    console.log('🧹 Cleaned up test workspace records.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runChecklistCompletionTest();
