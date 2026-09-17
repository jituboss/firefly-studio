'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { userPreferences, users } from '@/server/db/schema';
import { requireSession } from '@/server/auth/session';
import { consumeRateLimit, PROBE_LIMIT } from '@/server/auth/rate-limit';
import { recordAudit } from '@/server/audit';
import { normaliseBaseUrl, UrlGuardError } from '@/server/firefly/url-guard';
import { FireflyRequestError } from '@/server/firefly/client';
import {
  listAssetAccounts,
  probeInstance,
  probePrimaryCurrency,
  probeReachable,
  probeUser,
  type AssetAccount,
} from '@/server/firefly/probe';
import { checkVersion } from '@/server/firefly/version';
import { createConnection, getConnectionToken, getDefaultConnection } from '@/server/connections';

/** E2-13 … E2-21 — the onboarding wizard's server side. */

export interface ProbeState {
  ok?: boolean;
  error?: string;
  baseUrl?: string;
  instance?: {
    version: string;
    apiVersion: string;
    phpVersion: string;
    os: string;
    driver: string;
  };
  versionWarning?: string;
}

function describeError(error: unknown): string {
  if (error instanceof UrlGuardError || error instanceof FireflyRequestError) return error.message;
  return 'Something went wrong contacting that server.';
}

// --- Step 1: base URL -------------------------------------------------------

export async function probeBaseUrlAction(
  _prev: ProbeState,
  formData: FormData,
): Promise<ProbeState> {
  const session = await requireSession();
  const raw = String(formData.get('baseUrl') ?? '');

  const limit = await consumeRateLimit(
    `probe:${session.user.id}`,
    PROBE_LIMIT.limit,
    PROBE_LIMIT.windowMs,
  );
  if (!limit.allowed) {
    return { error: 'Too many connection attempts. Wait a few minutes and try again.' };
  }

  let baseUrl: string;
  try {
    baseUrl = normaliseBaseUrl(raw);
  } catch (error) {
    return { error: describeError(error) };
  }

  try {
    await probeReachable(baseUrl);

    await db
      .update(users)
      .set({ onboardingState: { step: 2, baseUrl }, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return { ok: true, baseUrl };
  } catch (error) {
    return { error: describeError(error), baseUrl };
  }
}

// --- Step 2: personal access token -----------------------------------------

export interface TokenState {
  ok?: boolean;
  error?: string;
  remoteEmail?: string;
  instance?: {
    version: string;
    apiVersion: string;
    phpVersion: string;
    os: string;
    driver: string;
  };
  versionWarning?: string;
}

export async function connectTokenAction(
  _prev: TokenState,
  formData: FormData,
): Promise<TokenState> {
  const session = await requireSession();
  const token = String(formData.get('token') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim() || 'My Firefly III';

  const state = session.user.onboardingState;
  const baseUrl = state?.baseUrl;
  if (!baseUrl) {
    return { error: 'Start again from step 1 — we no longer have the server address.' };
  }

  if (!token) return { error: 'Paste your Personal Access Token.' };

  const limit = await consumeRateLimit(
    `probe:${session.user.id}`,
    PROBE_LIMIT.limit,
    PROBE_LIMIT.windowMs,
  );
  if (!limit.allowed) {
    return { error: 'Too many attempts. Wait a few minutes and try again.' };
  }

  try {
    const remoteUser = await probeUser(baseUrl, token);
    const instance = await probeInstance(baseUrl, token);

    // E2-17 — the version gate runs here, not in step 1: reading the version
    // requires a token, so this is the first point at which we know it.
    const verdict = checkVersion(instance.version);
    if (verdict.status === 'blocked') {
      return { error: verdict.message };
    }

    const primaryCurrency = await probePrimaryCurrency(baseUrl, token);

    await createConnection({
      userId: session.user.id,
      label,
      baseUrl,
      token,
      instance,
      remoteUser,
      primaryCurrency,
    });

    await db
      .update(users)
      .set({ onboardingState: { step: 3, baseUrl }, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    const headerList = await headers();
    await recordAudit({
      userId: session.user.id,
      action: 'connection.created',
      entity: 'firefly_connection',
      ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: headerList.get('user-agent'),
      metadata: { baseUrl, fireflyVersion: instance.version },
    });

    return {
      ok: true,
      remoteEmail: remoteUser.email,
      instance,
      versionWarning: verdict.status === 'warn' ? verdict.message : undefined,
    };
  } catch (error) {
    return { error: describeError(error) };
  }
}

// --- Step 3: personalise ----------------------------------------------------

export interface PersonaliseOptions {
  currency: string | null;
  accounts: AssetAccount[];
}

/** Server component helper: what the personalise step needs to render. */
export async function loadPersonaliseOptions(): Promise<PersonaliseOptions> {
  const session = await requireSession();
  const connection = await getDefaultConnection(session.user.id);
  if (!connection) return { currency: null, accounts: [] };

  const credentials = await getConnectionToken(session.user.id, connection.id);
  if (!credentials) return { currency: connection.primaryCurrency, accounts: [] };

  const accounts = await listAssetAccounts(credentials.baseUrl, credentials.token);
  return { currency: connection.primaryCurrency, accounts };
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const session = await requireSession();

  const numberFormat = String(formData.get('numberFormat') ?? 'en-US');
  const dateFormat = String(formData.get('dateFormat') ?? 'medium');
  const weekStart = Number.parseInt(String(formData.get('weekStart') ?? '1'), 10);
  const defaultAccountIds = formData.getAll('accountIds').map(String);

  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      numberFormat,
      dateFormat,
      weekStart,
      defaultAccountIds,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { numberFormat, dateFormat, weekStart, defaultAccountIds, updatedAt: new Date() },
    });

  await db
    .update(users)
    .set({
      onboardingCompletedAt: new Date(),
      onboardingState: null,
      timezone: String(formData.get('timezone') ?? session.user.timezone),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  redirect('/dashboard');
}

/** E2-21 — where should the wizard resume? */
export async function resolveOnboardingStep(): Promise<1 | 2 | 3> {
  const session = await requireSession();
  const connection = await getDefaultConnection(session.user.id);
  if (connection && connection.status === 'ok') return 3;
  if (session.user.onboardingState?.baseUrl) return 2;
  return 1;
}
