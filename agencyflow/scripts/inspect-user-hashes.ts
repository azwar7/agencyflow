import { prisma } from '../src/lib/prisma';

async function checkUserHashes() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, passwordHash: true } });
  for (const u of users) {
    const isBcrypt = u.passwordHash.startsWith('$2a$') || u.passwordHash.startsWith('$2b$');
    console.log(`${u.email} -> len: ${u.passwordHash.length}, prefix: ${u.passwordHash.substring(0, 7)}, isBcrypt: ${isBcrypt}`);
  }
}

checkUserHashes().finally(() => prisma.$disconnect());
