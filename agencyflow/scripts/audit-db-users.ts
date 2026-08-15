import { prisma } from '../src/lib/prisma';

async function checkExistingUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      passwordHash: true,
      workspace: { select: { id: true, name: true } },
    },
  });

  console.log(`Found ${users.length} user accounts in the database:\n`);
  users.forEach((u, i) => {
    const isBcrypt = u.passwordHash.startsWith('$2a$') || u.passwordHash.startsWith('$2b$');
    const isSimulatedBase64 = u.passwordHash.startsWith('$2b$12$') && u.passwordHash.length < 50;
    const isRealBcrypt = isBcrypt && u.passwordHash.length >= 59 && !isSimulatedBase64;
    console.log(`User ${i + 1}:`);
    console.log(`  ID: ${u.id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Name: ${u.fullName}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Workspace: ${u.workspace?.name} (${u.workspace?.id})`);
    console.log(`  PasswordHash: ${u.passwordHash}`);
    console.log(`  Status: ${isRealBcrypt ? '✅ Real Bcrypt Hash' : '⚠️ Legacy / Non-Bcrypt Hash (Needs Reset)'}`);
    console.log('');
  });
}

checkExistingUsers().catch(console.error);
