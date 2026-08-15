import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with a cost factor of 12.
 * Rejects empty or non-string inputs.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password strictly against a real bcrypt password hash.
 * Returns false for empty inputs, malformed hashes, or mismatched passwords.
 * Never throws exceptions on malformed hashes and contains ZERO fallback mechanisms.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash || typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    // If bcrypt throws due to an invalid/malformed salt or hash format, safely reject
    return false;
  }
}
