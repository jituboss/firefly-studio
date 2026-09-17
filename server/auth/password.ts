import { hash, verify } from '@node-rs/argon2';

/**
 * §4.4 — Argon2id at the OWASP-recommended parameters.
 * m=19456 KiB (19 MiB), t=2, p=1.
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const MIN_PASSWORD_LENGTH = 12;

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

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  problems: string[];
}

const COMMON = new Set([
  'password',
  'passw0rd',
  'qwertyuiop',
  '1234567890',
  'letmein',
  'iloveyou',
  'administrator',
  'changeme',
  'firefly',
  'fireflyiii',
]);

/**
 * A deliberately small strength check rather than zxcvbn: the library adds
 * ~800 kB to the bundle for a score we only use to nudge. The hard floor is
 * length, which is what actually matters.
 */
export function scorePassword(password: string): PasswordStrength {
  const problems: string[] = [];
  const normalised = password.toLowerCase();

  if (password.length < MIN_PASSWORD_LENGTH) {
    problems.push(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (COMMON.has(normalised)) {
    problems.push('That is a commonly used password.');
  }
  if (/^(.)\1+$/.test(password)) {
    problems.push('Avoid repeating a single character.');
  }

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score += 1;
  if (problems.length > 0) score = Math.min(score, 1);

  return { score: Math.min(score, 4) as PasswordStrength['score'], problems };
}
