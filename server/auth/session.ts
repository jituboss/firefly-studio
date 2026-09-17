import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { sessions, users, type User } from '@/server/db/schema';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

/**
 * E2-01 — database-backed sessions.
 *
 * DEVIATION FROM THE PLAN (§2): the plan named Auth.js v5. Auth.js forces the
 * JWT strategy when the Credentials provider is used, which defeats the whole
 * reason we wanted database sessions — server-side revocation. Since the
 * `sessions` table already models everything we need (token hash, idle and
 * absolute expiry, elevation window, revocation), a direct implementation is
 * both smaller and does what was actually specified. See ADR-0004.
 */

const COOKIE_NAME = SESSION_COOKIE_NAME;
const TOKEN_BYTES = 32;

/** Absolute lifetime: you must sign in again after 30 days regardless. */
const ABSOLUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Idle lifetime: 7 days without a request ends the session. */
const IDLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** How long a step-up re-auth stays valid for destructive operations. */
const ELEVATION_TTL_MS = 5 * 60 * 1000;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export interface SessionContext {
  user: User;
  sessionId: string;
  isElevated: boolean;
}

export async function createSession(
  userId: string,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const now = Date.now();

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(now + ABSOLUTE_TTL_MS),
    idleExpiresAt: new Date(now + IDLE_TTL_MS),
    ip: meta.ip ?? null,
    userAgent: meta.userAgent ?? null,
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(ABSOLUTE_TTL_MS / 1000),
  });

  return token;
}

/**
 * Resolve the current session. Returns null for missing, expired, idle-expired
 * or revoked sessions, and slides the idle window on every successful read.
 */
export async function getSession(): Promise<SessionContext | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const now = new Date();
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        gt(sessions.idleExpiresAt, now),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  if (!row || row.user.status !== 'active') return null;

  // Slide the idle window, but only once a minute — every authenticated page
  // view would otherwise issue a write.
  if (now.getTime() - row.session.lastSeenAt.getTime() > 60_000) {
    await db
      .update(sessions)
      .set({ lastSeenAt: now, idleExpiresAt: new Date(now.getTime() + IDLE_TTL_MS) })
      .where(eq(sessions.id, row.session.id));
  }

  return {
    user: row.user,
    sessionId: row.session.id,
    isElevated: Boolean(
      row.session.elevatedUntil && row.session.elevatedUntil.getTime() > now.getTime(),
    ),
  };
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  store.delete(COOKIE_NAME);
}

/** Used after a password reset: every other device is signed out. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function elevateSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ elevatedUntil: new Date(Date.now() + ELEVATION_TTL_MS) })
    .where(eq(sessions.id, sessionId));
}

/** Constant-time compare for any user-supplied token we check by value. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export { SESSION_COOKIE_NAME };
