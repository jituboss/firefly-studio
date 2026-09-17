'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { requireSession, createSession } from '@/server/auth/session';
import { verifyPassword } from '@/server/auth/password';
import {
  beginTotpEnrolment,
  clearMfaChallenge,
  confirmTotpEnrolment,
  disableTotp,
  readMfaChallenge,
  verifyMfaCode,
} from '@/server/auth/mfa';
import { recordAudit } from '@/server/audit';
import { requestMeta } from '@/server/auth/request-meta';
import { consumeRateLimit } from '@/server/auth/rate-limit';

export interface MfaState {
  error?: string;
  notice?: string;
  /** Present only while enrolling — the QR payload and its manual fallback. */
  secret?: string;
  uri?: string;
  /** Shown exactly once, on successful confirmation. */
  recoveryCodes?: string[];
}

export async function beginMfaAction(_prev: MfaState, _formData: FormData): Promise<MfaState> {
  const session = await requireSession();
  const result = await beginTotpEnrolment(session.user.id, session.user.email);
  if ('error' in result) return { error: result.error };
  return { secret: result.secret, uri: result.uri };
}

export async function confirmMfaAction(_prev: MfaState, formData: FormData): Promise<MfaState> {
  const session = await requireSession();
  const code = String(formData.get('code') ?? '');

  const result = await confirmTotpEnrolment(session.user.id, code);
  if ('error' in result) {
    // Keep the enrolment panel open with its QR intact on a wrong code;
    // re-minting the secret would invalidate the QR they just scanned.
    return {
      error: result.error,
      secret: String(formData.get('secret') ?? '') || undefined,
      uri: String(formData.get('uri') ?? '') || undefined,
    };
  }

  const meta = await requestMeta();
  await recordAudit({ userId: session.user.id, action: 'auth.mfa.enabled', ...meta });

  revalidatePath('/settings/security');
  return { recoveryCodes: result.recoveryCodes, notice: 'Two-factor authentication is on.' };
}

/** Turning MFA off is a downgrade of account security, so it re-authenticates. */
export async function disableMfaAction(_prev: MfaState, formData: FormData): Promise<MfaState> {
  const session = await requireSession();
  const password = String(formData.get('password') ?? '');

  const digest = session.user.passwordHash;
  if (!digest || !(await verifyPassword(digest, password))) {
    return { error: 'That password is not correct.' };
  }

  await disableTotp(session.user.id);

  const meta = await requestMeta();
  await recordAudit({ userId: session.user.id, action: 'auth.mfa.disabled', ...meta });

  revalidatePath('/settings/security');
  return { notice: 'Two-factor authentication is off.' };
}

/**
 * The second step of sign-in. The user id comes from the signed challenge
 * cookie, never from the form — otherwise anyone could post a user id here and
 * skip the password entirely.
 */
export async function verifyMfaAction(_prev: MfaState, formData: FormData): Promise<MfaState> {
  const userId = await readMfaChallenge();
  if (!userId) {
    return { error: 'That took too long. Sign in again.' };
  }

  const meta = await requestMeta();
  const limit = await consumeRateLimit(`mfa:${userId}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    await recordAudit({ userId, action: 'auth.mfa.rate_limited', ...meta });
    return { error: 'Too many attempts. Try again in a few minutes.' };
  }

  const code = String(formData.get('code') ?? '');
  if (!(await verifyMfaCode(userId, code))) {
    await recordAudit({ userId, action: 'auth.mfa.failed', ...meta });
    return { error: 'That code is not right.' };
  }

  await clearMfaChallenge();
  await createSession(userId, {
    ip: meta.ip ?? undefined,
    userAgent: meta.userAgent ?? undefined,
  });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  await recordAudit({ userId, action: 'auth.signed_in', ...meta, metadata: { mfa: true } });

  redirect('/dashboard');
}
