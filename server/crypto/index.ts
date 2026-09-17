import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { getEnv } from '@/lib/env';

/**
 * E2-16 / §4.1 — envelope encryption for Firefly Personal Access Tokens.
 *
 * A 32-byte master key (APP_ENCRYPTION_KEY) derives a per-record data key via
 * HKDF-SHA256, salted with the record's own id. Two records therefore never
 * share a key, and the master key itself never touches a cipher directly.
 *
 * `keyVersion` is stored alongside every sealed value so a future rotation job
 * can re-wrap rows without a flag day.
 */

export const CURRENT_KEY_VERSION = 1;

const ALGORITHM = 'aes-256-gcm';
const NONCE_BYTES = 12;
const KEY_BYTES = 32;

export interface SealedValue {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: number;
}

function masterKey(): Buffer {
  return Buffer.from(getEnv().APP_ENCRYPTION_KEY, 'base64');
}

/**
 * Derive the data key for one record. `context` binds the key to a specific
 * row and purpose, so ciphertext copied into another row cannot be decrypted.
 */
function deriveKey(context: string, keyVersion: number): Buffer {
  const info = Buffer.from(`firefly-studio:v${keyVersion}:${context}`, 'utf8');
  return Buffer.from(hkdfSync('sha256', masterKey(), Buffer.alloc(0), info, KEY_BYTES));
}

export function seal(plaintext: string, context: string): SealedValue {
  const key = deriveKey(context, CURRENT_KEY_VERSION);
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, nonce);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    ciphertext: ciphertext.toString('base64'),
    nonce: nonce.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    keyVersion: CURRENT_KEY_VERSION,
  };
}

export function open(sealed: SealedValue, context: string): string {
  const key = deriveKey(context, sealed.keyVersion);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(sealed.nonce, 'base64'));
  decipher.setAuthTag(Buffer.from(sealed.authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** Last four characters, for display. Never reveals enough to be useful. */
export function tokenHint(token: string): string {
  return `••••${token.slice(-4)}`;
}
