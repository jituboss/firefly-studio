import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { mfaCredentials, mfaRecoveryCodes } from '@/server/db/schema';
import { open, seal, CURRENT_KEY_VERSION } from '@/server/crypto';
import { getEnv } from '@/lib/env';
import {
  generateRecoveryCodes,
  generateTotpSecret,
  normaliseRecoveryCode,
  totpUri,
  verifyTotp,
} from '@/lib/totp';

/**
 * E2-06 — TOTP enrolment and verification.
 *
 * The seed is sealed with the same AES-256-GCM envelope as the Firefly PAT
 * (`server/crypto`), under its own context string so a ciphertext cannot be
 * moved between the two tables and still open.
 *
 * An enrolment stays `confirmedAt: null` until the user proves they can produce
 * a code from it. That distinction is what stops someone locking themselves out
 * by scanning a QR into an app they then delete — an unconfirmed row is never
 * consulted at sign-in.
 */

const MFA_CONTEXT = 'mfa:totp';

export interface MfaStatus {
  enrolled: boolean;
  confirmedAt: Date | null;
  lastUsedAt: Date | null;
  remainingRecoveryCodes: number;
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  const [credential] = await db
    .select()
    .from(mfaCredentials)
    .where(and(eq(mfaCredentials.userId, userId), eq(mfaCredentials.type, 'totp')))
    .limit(1);

  const unused = await db
    .select({ id: mfaRecoveryCodes.id })
    .from(mfaRecoveryCodes)
    .where(and(eq(mfaRecoveryCodes.userId, userId), isNull(mfaRecoveryCodes.usedAt)));

  return {
    enrolled: Boolean(credential?.confirmedAt),
    confirmedAt: credential?.confirmedAt ?? null,
    lastUsedAt: credential?.lastUsedAt ?? null,
    remainingRecoveryCodes: unused.length,
  };
}

/** True when this account must answer a second factor to sign in. */
export async function isMfaRequired(userId: string): Promise<boolean> {
  const [credential] = await db
    .select({ id: mfaCredentials.id })
    .from(mfaCredentials)
    .where(
      and(
        eq(mfaCredentials.userId, userId),
        eq(mfaCredentials.type, 'totp'),
        isNotNull(mfaCredentials.confirmedAt),
      ),
    )
    .limit(1);
  return Boolean(credential);
}

/**
 * Start enrolment: mint a secret, store it unconfirmed, hand back the URI.
 *
 * Re-enrolling replaces any unconfirmed attempt, so a user who abandoned the
 * flow and came back does not accumulate dead rows — but a CONFIRMED credential
 * is never silently replaced, because that would be a way to swap someone's
 * second factor out from under them.
 */
export async function beginTotpEnrolment(
  userId: string,
  accountLabel: string,
): Promise<{ secret: string; uri: string } | { error: string }> {
  const [existing] = await db
    .select()
    .from(mfaCredentials)
    .where(and(eq(mfaCredentials.userId, userId), eq(mfaCredentials.type, 'totp')))
    .limit(1);

  if (existing?.confirmedAt) {
    return { error: 'Two-factor authentication is already on. Turn it off first to re-enrol.' };
  }

  const secret = generateTotpSecret();
  const sealed = seal(secret, MFA_CONTEXT);

  if (existing) {
    await db
      .update(mfaCredentials)
      .set({
        secretCiphertext: sealed.ciphertext,
        secretNonce: sealed.nonce,
        secretAuthTag: sealed.authTag,
        keyVersion: CURRENT_KEY_VERSION,
        updatedAt: new Date(),
      })
      .where(eq(mfaCredentials.id, existing.id));
  } else {
    await db.insert(mfaCredentials).values({
      userId,
      type: 'totp',
      label: 'Authenticator app',
      secretCiphertext: sealed.ciphertext,
      secretNonce: sealed.nonce,
      secretAuthTag: sealed.authTag,
      keyVersion: CURRENT_KEY_VERSION,
    });
  }

  return { secret, uri: totpUri(secret, accountLabel) };
}

async function readSecret(userId: string): Promise<string | null> {
  const [credential] = await db
    .select()
    .from(mfaCredentials)
    .where(and(eq(mfaCredentials.userId, userId), eq(mfaCredentials.type, 'totp')))
    .limit(1);
  if (!credential) return null;

  return open(
    {
      ciphertext: credential.secretCiphertext,
      nonce: credential.secretNonce,
      authTag: credential.secretAuthTag,
      keyVersion: credential.keyVersion,
    },
    MFA_CONTEXT,
  );
}

/**
 * Finish enrolment. Returns the recovery codes, which are shown ONCE — only
 * their hashes are kept, so this is the only moment they exist in readable form.
 */
export async function confirmTotpEnrolment(
  userId: string,
  code: string,
): Promise<{ recoveryCodes: string[] } | { error: string }> {
  const secret = await readSecret(userId);
  if (!secret) return { error: 'Start enrolment again — no pending setup was found.' };

  if (!verifyTotp(secret, code)) {
    return { error: 'That code is not right. Check your authenticator app and try again.' };
  }

  await db
    .update(mfaCredentials)
    .set({ confirmedAt: new Date(), lastUsedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(mfaCredentials.userId, userId), eq(mfaCredentials.type, 'totp')));

  const codes = generateRecoveryCodes();
  // Replace wholesale: enrolling again must not leave codes from a previous
  // enrolment usable against the new secret.
  await db.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, userId));
  await db
    .insert(mfaRecoveryCodes)
    .values(codes.map((value) => ({ userId, codeHash: hashRecoveryCode(value) })));

  return { recoveryCodes: codes };
}

export async function disableTotp(userId: string): Promise<void> {
  await db
    .delete(mfaCredentials)
    .where(and(eq(mfaCredentials.userId, userId), eq(mfaCredentials.type, 'totp')));
  await db.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, userId));
}

/** Verify a TOTP code, or a single-use recovery code, at sign-in. */
export async function verifyMfaCode(userId: string, code: string): Promise<boolean> {
  const secret = await readSecret(userId);
  if (!secret) return false;

  if (verifyTotp(secret, code)) {
    await db
      .update(mfaCredentials)
      .set({ lastUsedAt: new Date() })
      .where(and(eq(mfaCredentials.userId, userId), eq(mfaCredentials.type, 'totp')));
    return true;
  }

  return consumeRecoveryCode(userId, code);
}

/**
 * Recovery codes are hashed with plain SHA-256, not Argon2id.
 *
 * Deliberate: a recovery code is 10 characters from a 30-character alphabet
 * (~49 bits) generated by a CSPRNG, so it has no guessable structure for a
 * dictionary attack to exploit — the slow-KDF argument that applies to
 * user-chosen passwords does not apply here. The comparison is still constant
 * time.
 */
function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normaliseRecoveryCode(code)).digest('hex');
}

async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const normalised = normaliseRecoveryCode(code);
  if (normalised.length < 8) return false;

  const target = hashRecoveryCode(normalised);
  const rows = await db
    .select()
    .from(mfaRecoveryCodes)
    .where(and(eq(mfaRecoveryCodes.userId, userId), isNull(mfaRecoveryCodes.usedAt)));

  for (const row of rows) {
    const a = Buffer.from(row.codeHash);
    const b = Buffer.from(target);
    if (a.length !== b.length || !timingSafeEqual(a, b)) continue;

    await db
      .update(mfaRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(eq(mfaRecoveryCodes.id, row.id));
    return true;
  }

  return false;
}

// --- the sign-in challenge ---------------------------------------------------

/**
 * Between "password accepted" and "code accepted" there is a half-authenticated
 * state that has to survive a round trip. It is carried in a short-lived signed
 * cookie rather than a session row: it is not a session, and creating one before
 * the second factor is answered would mean a real session existed for an
 * unauthenticated user for as long as they stalled.
 *
 * The cookie holds only a user id and an expiry, HMAC'd with AUTH_SECRET, so it
 * cannot be forged or replayed past its five minutes.
 */
const CHALLENGE_COOKIE = 'fs_mfa';
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function signChallenge(payload: string): string {
  return createHmac('sha256', getEnv().AUTH_SECRET).update(payload).digest('base64url');
}

export async function startMfaChallenge(userId: string): Promise<void> {
  const payload = `${userId}.${Date.now() + CHALLENGE_TTL_MS}`;
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, `${payload}.${signChallenge(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

export async function readMfaChallenge(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(CHALLENGE_COOKIE)?.value;
  if (!raw) return null;

  const index = raw.lastIndexOf('.');
  if (index === -1) return null;

  const payload = raw.slice(0, index);
  const signature = raw.slice(index + 1);

  const expected = Buffer.from(signChallenge(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const [userId, expiresAt] = payload.split('.');
  if (!userId || !expiresAt) return null;
  if (Number.parseInt(expiresAt, 10) < Date.now()) return null;

  return userId;
}

export async function clearMfaChallenge(): Promise<void> {
  const store = await cookies();
  store.delete(CHALLENGE_COOKIE);
}
