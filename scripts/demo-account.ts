import 'dotenv/config';

import { eq } from 'drizzle-orm';
import { db, pool } from '@/server/db';
import { users, userPreferences } from '@/server/db/schema';
import { hashPassword } from '@/server/auth/password';
import { createConnection, deleteConnection, listConnections } from '@/server/connections';
import { probeInstance, probePrimaryCurrency, probeUser } from '@/server/firefly/probe';

/**
 * E2-26 — create (or repair) the shared demo account.
 *
 *   pnpm demo:account
 *
 * Idempotent: run it as often as you like. It creates the app user if missing,
 * marks it verified and `is_demo`, and attaches the Firefly connection the
 * demo ledger lives on. What it deliberately does NOT do is seed the ledger —
 * that is `pnpm demo:seed`, so the data can be rebuilt without touching the
 * account, and the account can be repaired without rebuilding the data.
 *
 * Environment:
 *   DEMO_EMAIL       default me@rezaur.xyz
 *   DEMO_PASSWORD    default demo1234 (published in the README — see below)
 *   FIREFLY_URL       the instance the demo reads, as the APP will reach it
 *   FIREFLY_PROBE_URL where to verify it from, when that differs (compose)
 *   FIREFLY_PAT       a token on that instance
 *
 * The password being weak and published is the point: it is a shared account
 * on a throwaway ledger, and `lib/demo.ts` refuses everything that a published
 * password would otherwise put at risk — connections, the danger zone,
 * credential changes, account deletion and step-up elevation.
 */
const EMAIL = (process.env.DEMO_EMAIL ?? 'me@rezaur.xyz').toLowerCase();
const PASSWORD = process.env.DEMO_PASSWORD ?? 'demo1234';
const FIREFLY_URL = (process.env.FIREFLY_URL ?? process.env.DEV_FIREFLY_URL ?? '')
  .trim()
  .replace(/\/+$/, '');
const FIREFLY_PAT = (process.env.FIREFLY_PAT ?? process.env.DEV_FIREFLY_PAT ?? '').trim();

/*
 * The URL to VERIFY with, which is not always the URL to STORE.
 *
 * In compose the app reaches Firefly at http://firefly:8080, a hostname that
 * only resolves inside that network — so this script, run from a laptop,
 * cannot probe it. FIREFLY_PROBE_URL is how you say "check it here, save it as
 * that". Leave it unset and the two are the same, which is the normal case.
 */
const PROBE_URL = (process.env.FIREFLY_PROBE_URL ?? FIREFLY_URL).trim().replace(/\/+$/, '');

async function main() {
  if (!FIREFLY_URL || !FIREFLY_PAT) {
    throw new Error(
      'FIREFLY_URL and FIREFLY_PAT must be set (DEV_FIREFLY_URL/DEV_FIREFLY_PAT also work).',
    );
  }

  const now = new Date();
  const [existing] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1);

  let userId: string;
  if (existing) {
    // Repair rather than recreate: the connection and preferences hang off this
    // id, and a demo that is reprovisioned nightly should not change identity.
    await db
      .update(users)
      .set({
        isDemo: true,
        status: 'active',
        emailVerifiedAt: existing.emailVerifiedAt ?? now,
        onboardingCompletedAt: existing.onboardingCompletedAt ?? now,
        passwordHash: await hashPassword(PASSWORD),
        displayName: 'Demo',
        deletedAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id));
    userId = existing.id;
    console.log(`Updated the demo account (${EMAIL}).`);
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email: EMAIL,
        passwordHash: await hashPassword(PASSWORD),
        displayName: 'Demo',
        isDemo: true,
        emailVerifiedAt: now,
        onboardingCompletedAt: now,
      })
      .returning({ id: users.id });
    userId = created!.id;
    console.log(`Created the demo account (${EMAIL}).`);
  }

  await db
    .insert(userPreferences)
    .values({ userId, defaultLandingPage: '/dashboard' })
    .onConflictDoNothing();

  const connections = await listConnections(userId);
  const attached = connections[0];

  /*
   * The URL has to be reachable FROM THE APP, which is not where this script
   * runs. Seeding from a laptop against http://127.0.0.1:8080 and then storing
   * that as the connection gives a demo that signs in perfectly and shows
   * zeroes everywhere, because inside the container 127.0.0.1 is the container.
   * So a stored URL that disagrees with FIREFLY_URL is replaced rather than
   * kept.
   */
  if (attached && attached.baseUrl !== FIREFLY_URL) {
    console.log(`Replacing connection: ${attached.baseUrl} → ${FIREFLY_URL}`);
    await deleteConnection(userId, attached.id);
  }

  if (attached && attached.baseUrl === FIREFLY_URL) {
    console.log(`Connection already attached: ${attached.label} (${attached.baseUrl})`);
  } else {
    // Probe first, exactly as onboarding does — a demo account wired to an
    // instance that does not answer is a worse first impression than no demo.
    const [instance, remoteUser, currency] = await Promise.all([
      probeInstance(PROBE_URL, FIREFLY_PAT),
      probeUser(PROBE_URL, FIREFLY_PAT),
      probePrimaryCurrency(PROBE_URL, FIREFLY_PAT),
    ]);
    await createConnection({
      userId,
      label: 'Demo ledger',
      baseUrl: FIREFLY_URL,
      token: FIREFLY_PAT,
      instance,
      remoteUser,
      primaryCurrency: currency,
    });
    console.log(
      `Attached ${FIREFLY_URL}${PROBE_URL === FIREFLY_URL ? '' : ` (verified via ${PROBE_URL})`}` +
        ` — Firefly III ${instance.version}.`,
    );
  }

  console.log(`\nSign in with  ${EMAIL}  /  ${PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
