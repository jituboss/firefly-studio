import { hash, verify } from '@node-rs/argon2';

/**
 * §4.4 — Argon2id at the OWASP-recommended parameters.
 * m=19456 KiB (19 MiB), t=2, p=1.
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(digest: string, password: string): Promise<boolean> {
  try {
    return await verify(digest, password, OPTIONS);
  } catch {
    return false;
  }
}

/**
 * Strength scoring lives in `lib/password-strength.ts` so the sign-up form's
 * meter and this enforcement path cannot disagree — they were separate
 * implementations of the same four rules, which is a bug waiting to happen.
 */
export {
  MIN_PASSWORD_LENGTH,
  STRENGTH_LABELS,
  scorePassword,
  type PasswordStrength,
} from '@/lib/password-strength';
