import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import { db, pool } from '@/server/db';
import { users, userPreferences } from '@/server/db/schema';

/**
 * Dev utility: mark an account's email as confirmed without a mail server.
 *
 * Needed because E2-28 (real email transport) is not built yet — sign-up sends
 * its confirmation link to the server log via the console transport. This is
 * the escape hatch for local development and self-host evaluation.
 *
 *   pnpm user:verify a@a.com rez28r@gmail.com
 *   pnpm user:verify --all
 *   pnpm user:verify --list
 */

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: pnpm user:verify <email...> | --all | --list');
    return;
  }

  if (args.includes('--list')) {
    const rows = await db
      .select({
        email: users.email,
        status: users.status,
        verified: users.emailVerifiedAt,
        onboarded: users.onboardingCompletedAt,
      })
      .from(users);

    for (const row of rows) {
      console.log(
        [
          row.email.padEnd(24),
          row.status.padEnd(10),
          row.verified ? 'verified' : 'UNVERIFIED',
          row.onboarded ? 'onboarded' : 'not onboarded',
        ].join('  '),
      );
    }
    return;
  }

  const emails = args.filter((arg) => !arg.startsWith('--')).map((arg) => arg.toLowerCase());
  const all = args.includes('--all');

  const targets = all
    ? await db.select({ id: users.id, email: users.email }).from(users)
    : await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.email, emails));

  if (targets.length === 0) {
    console.error(`No matching accounts. Known emails:`);
    const rows = await db.select({ email: users.email }).from(users);
    for (const row of rows) console.error(`  ${row.email}`);
    process.exitCode = 1;
    return;
  }

  for (const target of targets) {
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date(), status: 'active', updatedAt: new Date() })
      .where(eq(users.id, target.id));

    // Sign-up creates this row, but a user made another way may not have one.
    await db.insert(userPreferences).values({ userId: target.id }).onConflictDoNothing();

    console.log(`verified  ${target.email}`);
  }

  console.log(`\n${targets.length} account(s) confirmed. You can sign in now.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
