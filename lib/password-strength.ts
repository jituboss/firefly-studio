/**
 * E2-27 — password strength scoring, shared by the server action that enforces
 * it and the meter that previews it.
 *
 * It lived in two places: `server/auth/password.ts` graded the submitted
 * password, and the sign-up form reimplemented the same four rules to draw the
 * meter. Two copies of a rule that has to agree is one copy too many — a
 * password could score 3 bars and then be rejected. One function now, imported
 * by both.
 *
 * **Deliberately not zxcvbn.** The library is ~800 kB in the client bundle, and
 * it buys a better-calibrated score for something we only use to nudge. The
 * hard floor is length, which is what actually resists a modern cracker; the
 * real defence against a *known* password is the breach check in
 * `server/auth/breach.ts`, which zxcvbn does not do.
 */

export const MIN_PASSWORD_LENGTH = 12;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  /** Blocking reasons. Non-empty means the password must be rejected. */
  problems: string[];
}

export const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const;

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
  'fireflystudio',
]);

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
  // A password with a blocking problem must never present as "Good", however
  // long it is: "aaaaaaaaaaaaaaaa" would otherwise score 2 on length alone.
  if (problems.length > 0) score = Math.min(score, 1);

  return { score: Math.min(score, 4) as PasswordStrength['score'], problems };
}
