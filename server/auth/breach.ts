import 'server-only';
import { createHash } from 'node:crypto';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * E2-27 — Have I Been Pwned, via the k-anonymity range API.
 *
 * **The password never leaves this process.** It is SHA-1'd locally, the first
 * five hex characters of the digest are sent, and HIBP returns every suffix it
 * holds under that prefix — around 500-1000 of them. The comparison happens
 * here. HIBP cannot learn the password, and cannot even learn which of the
 * returned hashes was the one being asked about.
 *
 * SHA-1 is not a security choice here: it is the digest HIBP's corpus is keyed
 * by. It is a lookup key against a public dataset, never a stored credential —
 * those are Argon2id in `password.ts`.
 *
 * **Opt-in.** A self-hosted finance app phoning a third party on every sign-up
 * is a decision for whoever runs it, so `PASSWORD_BREACH_CHECK` defaults off.
 *
 * **Fails open.** If HIBP is down, slow, or rate-limiting, sign-up proceeds.
 * A breach check is an improvement on a password that already passed the
 * length and common-password floors; letting an outage block account creation
 * would trade a small risk for a total one.
 */

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range';
const TIMEOUT_MS = 3_000;

export interface BreachResult {
  breached: boolean;
  /** How many times HIBP has seen it. 0 when unknown or not breached. */
  count: number;
  /** True when the check could not be completed, so the answer is "unknown". */
  skipped: boolean;
}

export async function checkPasswordBreached(password: string): Promise<BreachResult> {
  const env = getEnv();
  if (!env.PASSWORD_BREACH_CHECK) return { breached: false, count: 0, skipped: true };

  const digest = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);

  try {
    const response = await fetch(`${HIBP_RANGE_URL}/${prefix}`, {
      headers: {
        // Asks HIBP to pad the response with random entries, so an observer
        // cannot infer anything from its size.
        'Add-Padding': 'true',
        'User-Agent': 'firefly-studio',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, 'HIBP range lookup failed; skipping breach check');
      return { breached: false, count: 0, skipped: true };
    }

    const body = await response.text();
    for (const line of body.split('\n')) {
      const [candidate, seen] = line.trim().split(':');
      if (candidate !== suffix) continue;
      // Padded entries are returned with a count of 0; a real hit never is.
      const count = Number.parseInt(seen ?? '0', 10) || 0;
      if (count > 0) return { breached: true, count, skipped: false };
    }

    return { breached: false, count: 0, skipped: false };
  } catch (error) {
    logger.warn({ err: error }, 'HIBP range lookup errored; skipping breach check');
    return { breached: false, count: 0, skipped: true };
  }
}

/** The message shown when a password is known to be breached. */
export function breachMessage(count: number): string {
  return `This password has appeared in ${count.toLocaleString()} known data breach${
    count === 1 ? '' : 'es'
  }. Choose a different one.`;
}
