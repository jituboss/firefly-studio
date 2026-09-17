import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { emailTokens } from '@/server/db/schema';

/** E2-03 / E2-05 — single-use, hashed email tokens. */

export type TokenPurpose = 'verify_email' | 'reset_password' | 'change_email';

const TTL_MS: Record<TokenPurpose, number> = {
  verify_email: 24 * 60 * 60 * 1000,
  reset_password: 60 * 60 * 1000,
  change_email: 24 * 60 * 60 * 1000,
};

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function issueToken(userId: string, purpose: TokenPurpose): Promise<string> {
  const token = randomBytes(32).toString('base64url');

  await db.insert(emailTokens).values({
    userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TTL_MS[purpose]),
  });

  return token;
}

/**
 * Consume a token atomically: the UPDATE only matches an unconsumed, unexpired
 * row, so a double submission cannot use the same token twice.
 */
export async function consumeToken(
  token: string,
  purpose: TokenPurpose,
): Promise<{ userId: string } | null> {
  const [row] = await db
    .update(emailTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(emailTokens.tokenHash, hashToken(token)),
        eq(emailTokens.purpose, purpose),
        isNull(emailTokens.consumedAt),
        gt(emailTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: emailTokens.userId });

  return row ?? null;
}
