'use server';

import { requestMeta } from './request-meta';
import { isMfaRequired, startMfaChallenge } from './mfa';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db';
import { users, userPreferences } from '@/server/db/schema';
import { getEnv } from '@/lib/env';
import { hashPassword, scorePassword, verifyPassword } from './password';
import { breachMessage, checkPasswordBreached } from './breach';
import { createSession, destroyCurrentSession, revokeAllSessions } from './session';
import { consumeToken, issueToken } from './tokens';
import { consumeRateLimit, EMAIL_LIMIT, LOGIN_LIMIT } from './rate-limit';
import { recordAudit } from '@/server/audit';
import { passwordResetMail, sendMail, verificationMail } from '@/server/mail';

/**
 * E2-02 … E2-05 — auth server actions.
 *
 * Next.js Server Actions carry built-in CSRF protection (Origin/Host check on
 * every POST), which is why there is no separate double-submit token here.
 */

export interface ActionState {
  error?: string;
  notice?: string;
  fieldErrors?: Record<string, string>;
}

const emailSchema = z.email('Enter a valid email address.').max(254);

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim();

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { fieldErrors: { email: 'Enter a valid email address.' } };
  }

  const strength = scorePassword(password);
  if (strength.problems.length > 0) {
    return { fieldErrors: { password: strength.problems.join(' ') } };
  }

  // E2-27 — ordered after the local rules on purpose: a password that fails on
  // length should never cost an outbound request. No-ops unless
  // PASSWORD_BREACH_CHECK is on, and fails open if HIBP is unreachable.
  const breach = await checkPasswordBreached(password);
  if (breach.breached) {
    return { fieldErrors: { password: breachMessage(breach.count) } };
  }

  const meta = await requestMeta();
  const limit = await consumeRateLimit(`signup:${meta.ip ?? 'unknown'}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return { error: 'Too many sign-up attempts. Try again later.' };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    // Do not reveal that the address is taken. Tell the same story either way
    // and let the (unsent) email be the differentiator.
    await recordAudit({ action: 'auth.signup.duplicate', ...meta, metadata: { email } });
    return {
      notice:
        'Check your email to confirm your address. If an account already exists, we have sent a sign-in reminder instead.',
    };
  }

  const passwordHash = await hashPassword(password);

  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, displayName: displayName || null })
    .returning({ id: users.id });

  const userId = created!.id;
  await db.insert(userPreferences).values({ userId }).onConflictDoNothing();

  const token = await issueToken(userId, 'verify_email');
  await sendMail(
    verificationMail(
      email,
      `${getEnv().APP_URL}/verify-email/confirm?token=${encodeURIComponent(token)}`,
    ),
  );

  await recordAudit({ userId, action: 'auth.signup', ...meta });

  return { notice: 'Check your email to confirm your address.' };
}

// ---------------------------------------------------------------------------
// Verify email
// ---------------------------------------------------------------------------

export async function verifyEmailAction(token: string): Promise<{ ok: boolean; message: string }> {
  const consumed = await consumeToken(token, 'verify_email');
  if (!consumed) {
    return { ok: false, message: 'That confirmation link is invalid or has expired.' };
  }

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, consumed.userId));

  const meta = await requestMeta();
  await recordAudit({ userId: consumed.userId, action: 'auth.email_verified', ...meta });
  await createSession(consumed.userId, {
    ip: meta.ip ?? undefined,
    userAgent: meta.userAgent ?? undefined,
  });

  return { ok: true, message: 'Email confirmed.' };
}

export async function resendVerificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const meta = await requestMeta();

  const limit = await consumeRateLimit(`verify:${email}`, EMAIL_LIMIT.limit, EMAIL_LIMIT.windowMs);
  if (!limit.allowed) {
    return {
      error: `Too many requests. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const [user] = await db
    .select({ id: users.id, verified: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user && !user.verified) {
    const token = await issueToken(user.id, 'verify_email');
    await sendMail(
      verificationMail(
        email,
        `${getEnv().APP_URL}/verify-email/confirm?token=${encodeURIComponent(token)}`,
      ),
    );
    await recordAudit({ userId: user.id, action: 'auth.verification_resent', ...meta });
  }

  return { notice: 'If that address needs confirming, a new link is on its way.' };
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const meta = await requestMeta();

  // Keyed on both email and IP so one attacker cannot lock out a victim by
  // exhausting the email bucket alone.
  const byEmail = await consumeRateLimit(
    `login:e:${email}`,
    LOGIN_LIMIT.limit,
    LOGIN_LIMIT.windowMs,
  );
  const byIp = await consumeRateLimit(
    `login:i:${meta.ip ?? 'unknown'}`,
    LOGIN_LIMIT.limit * 4,
    LOGIN_LIMIT.windowMs,
  );

  if (!byEmail.allowed || !byIp.allowed) {
    await recordAudit({ action: 'auth.login.rate_limited', ...meta, metadata: { email } });
    return { error: 'Too many sign-in attempts. Try again in a few minutes.' };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always run a verification so the response time does not reveal whether the
  // address exists. The dummy hash is a real Argon2id digest.
  const digest =
    user?.passwordHash ??
    '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$J4moa2MP0/HHY1+YfLIcMRRZeUQL/3xsHDgTGDUnGFY';
  const valid = await verifyPassword(digest, password);

  if (!user || !valid || user.deletedAt || user.status !== 'active') {
    await recordAudit({ action: 'auth.login.failed', ...meta, metadata: { email } });
    return { error: 'Email or password is incorrect.' };
  }

  if (!user.emailVerifiedAt) {
    return {
      error:
        'Confirm your email address first. Check your inbox for the link, or request a new one.',
    };
  }

  // E2-06 — a confirmed second factor means no session yet. The half-
  // authenticated state lives in a short-lived signed cookie, not a session
  // row: creating a real session here would leave one open for an
  // unauthenticated user for as long as they stall on the code screen.
  if (await isMfaRequired(user.id)) {
    await startMfaChallenge(user.id);
    await recordAudit({ userId: user.id, action: 'auth.mfa.challenged', ...meta });
    redirect('/sign-in/verify');
  }

  await createSession(user.id, {
    ip: meta.ip ?? undefined,
    userAgent: meta.userAgent ?? undefined,
  });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await recordAudit({ userId: user.id, action: 'auth.login', ...meta });

  redirect('/dashboard');
}

export async function signOutAction(): Promise<never> {
  await destroyCurrentSession();
  redirect('/sign-in');
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const meta = await requestMeta();

  const limit = await consumeRateLimit(`reset:${email}`, EMAIL_LIMIT.limit, EMAIL_LIMIT.windowMs);
  if (!limit.allowed) {
    return { error: 'Too many requests. Try again later.' };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    const token = await issueToken(user.id, 'reset_password');
    await sendMail(
      passwordResetMail(
        email,
        `${getEnv().APP_URL}/reset-password?token=${encodeURIComponent(token)}`,
      ),
    );
    await recordAudit({ userId: user.id, action: 'auth.password_reset.requested', ...meta });
  }

  // Same response whether or not the account exists.
  return { notice: 'If that address has an account, a reset link is on its way.' };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');

  const strength = scorePassword(password);
  if (strength.problems.length > 0) {
    return { fieldErrors: { password: strength.problems.join(' ') } };
  }

  const breach = await checkPasswordBreached(password);
  if (breach.breached) {
    return { fieldErrors: { password: breachMessage(breach.count) } };
  }

  const consumed = await consumeToken(token, 'reset_password');
  if (!consumed) {
    return { error: 'That reset link is invalid or has expired. Request a new one.' };
  }

  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash, emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, consumed.userId));

  // A reset is a credential change: every existing session dies.
  await revokeAllSessions(consumed.userId);

  const meta = await requestMeta();
  await recordAudit({ userId: consumed.userId, action: 'auth.password_reset.completed', ...meta });

  redirect('/sign-in?reset=1');
}
