import { hashPassword, verifyPassword } from '../src/lib/password';

async function runPasswordSecurityTests() {
  console.log('🔒 Running Comprehensive Pure Bcrypt Password Security Tests...\n');
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

  // 1. Real bcrypt hashing and verification
  console.log('--- 1. Real Bcrypt Hashing & Verification ---');
  const realPassword = 'RealProductionPassword2026!';
  const realHash = await hashPassword(realPassword);

  assert(realHash.startsWith('$2a$') || realHash.startsWith('$2b$'), 'Generates standard bcrypt formatted hash');
  assert(realHash.length >= 59, 'Bcrypt hash is full length (>= 59 chars)');
  assert(!realHash.includes(Buffer.from(realPassword).toString('base64')), 'No base64 plaintext embedded');

  const correctMatch = await verifyPassword(realPassword, realHash);
  assert(correctMatch === true, 'Correct password authenticates successfully against real bcrypt hash');

  const wrongMatch = await verifyPassword('IncorrectPassword123', realHash);
  assert(wrongMatch === false, 'Wrong password is rejected');

  // 2. Empty & Invalid inputs
  console.log('\n--- 2. Empty & Invalid Input Handling ---');
  const emptyPassMatch = await verifyPassword('', realHash);
  assert(emptyPassMatch === false, 'Empty password string returns false');

  const emptyHashMatch = await verifyPassword(realPassword, '');
  assert(emptyHashMatch === false, 'Empty hash string returns false');

  const nullPassMatch = await verifyPassword(null as any, realHash);
  assert(nullPassMatch === false, 'Null password returns false');

  const nullHashMatch = await verifyPassword(realPassword, null as any);
  assert(nullHashMatch === false, 'Null hash returns false');

  let hashEmptyThrows = false;
  try {
    await hashPassword('');
  } catch {
    hashEmptyThrows = true;
  }
  assert(hashEmptyThrows, 'hashPassword rejects empty password with an Error');

  // 3. Rejection of Legacy Fake Base64 Hashes ($2b$12$<base64>)
  console.log('\n--- 3. Rejection of Legacy Fake Base64 Hashes ---');
  const fakeBase64Hash = `$2b$12$${Buffer.from('Password123!').toString('base64')}`;
  const fakeMatch1 = await verifyPassword('Password123!', fakeBase64Hash);
  assert(fakeMatch1 === false, 'Legacy fake Base64 hash ($2b$12$<base64>) is strictly REJECTED');

  const fakeMatch2 = await verifyPassword('password123', '$2b$12$cGFzc3dvcmQxMjM=');
  assert(fakeMatch2 === false, 'Legacy fake Base64 hash for password123 is strictly REJECTED');

  // 4. Rejection of Legacy Hard-coded Seed String (seeded_demo_hash)
  console.log('\n--- 4. Rejection of Hardcoded Seed Strings ---');
  const seedMatch1 = await verifyPassword('password123', 'seeded_demo_hash');
  assert(seedMatch1 === false, 'seeded_demo_hash with password123 is strictly REJECTED');

  const seedMatch2 = await verifyPassword('Password123!', 'seeded_demo_hash');
  assert(seedMatch2 === false, 'seeded_demo_hash with Password123! is strictly REJECTED');

  const dummyPassMatch = await verifyPassword('AgencyFlow2026!', 'invited_team_member');
  assert(dummyPassMatch === false, 'invited_team_member plain string is strictly REJECTED');

  // 5. Safe handling of Malformed Hashes
  console.log('\n--- 5. Safe Handling of Malformed Hashes ---');
  const malformed1 = await verifyPassword('Password123!', 'not_a_valid_hash_at_all');
  assert(malformed1 === false, 'Arbitrary plaintext hash returns false without crashing');

  const malformed2 = await verifyPassword('Password123!', '$2b$12$invalidSaltThatCausesBcryptError');
  assert(malformed2 === false, 'Truncated bcrypt hash safely returns false without throwing');

  const malformed3 = await verifyPassword('Password123!', '$$$$$invalid$$$$');
  assert(malformed3 === false, 'Corrupted dollar-sign prefix safely returns false');

  console.log('\n========================================');
  console.log(`Password Security Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPasswordSecurityTests();
