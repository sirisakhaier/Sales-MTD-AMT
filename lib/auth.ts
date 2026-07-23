import crypto from 'crypto';

/**
 * Hashes a plaintext password using SHA-256 with salt.
 */
export function hashPassword(password: string): string {
  const salt = 'sales-mtd-salt-2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Verifies if a password matches a given hash.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
