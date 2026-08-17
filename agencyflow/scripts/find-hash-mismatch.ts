import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';

async function check() {
  const data = JSON.parse(fs.readFileSync('./backups/sqlite-data-export.json', 'utf-8')).data;
  const users = await prisma.user.findMany();
  for (const u of data.users) {
    const found = users.find((x) => x.id === u.id);
    if (!found) {
      console.log('User not in DB:', u.email);
    } else if (found.passwordHash !== u.passwordHash) {
      console.log('Mismatch:', u.email, 'source:', u.passwordHash, 'db:', found.passwordHash);
      // Restore exact hash from source
      await prisma.user.update({
        where: { id: u.id },
        data: { passwordHash: u.passwordHash },
      });
      console.log('Restored exact source hash for:', u.email);
    }
  }
}

check().finally(() => prisma.$disconnect());
