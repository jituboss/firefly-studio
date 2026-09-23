import 'dotenv/config';
import { and, eq, isNull } from 'drizzle-orm';
import { db, pool } from '@/server/db';
import { users } from '@/server/db/schema';

/**
 * Grant or revoke the administrator role from a shell.
 *
 * This is the recovery path, and it has to work when the app does not: an
 * instance whose only admin deleted themselves, a deployment restored from a
 * backup taken before anyone was promoted, a demo-only box where the migration
 * deliberately promoted nobody.
 *
 *   pnpm user:admin --list
 *   pnpm user:admin grant you@example.com
 *   pnpm user:admin revoke someone@example.com
 *
 * In a running container there is no pnpm, no tsx and no `scripts/` — the
 * runtime image is a Next.js standalone build. `scripts/build-cli.ts` bundles
 * this to `dist/user-admin.cjs`, which is what an operator actually runs:
 *
 *   docker compose exec app node dist/user-admin.cjs grant you@example.com
 */

const USAGE = `Usage:
  pnpm user:admin --list
  pnpm user:admin grant <email>
  pnpm user:admin revoke <email> [--force]

In a container:
  docker compose exec app node dist/user-admin.cjs grant <email>

--force lets you revoke the last administrator, which leaves the admin page
unreachable until this command grants it to someone again.`;

async function list() {
  const rows = await db
    .select({
      email: users.email,
      role: users.role,
      status: users.status,
      isDemo: users.isDemo,
      verified: users.emailVerifiedAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  if (rows.length === 0) {
    console.log('No accounts yet. The first one to sign up becomes the administrator.');
    return;
  }

  for (const row of rows) {
    console.log(
      [
        row.email.padEnd(32),
        (row.deletedAt ? 'deleted' : row.role).padEnd(8),
        row.status.padEnd(10),
        row.verified ? 'verified  ' : 'UNVERIFIED',
        row.isDemo ? 'demo' : '',
      ]
        .join('  ')
        .trimEnd(),
    );
  }
}

async function setRole(email: string, role: 'admin' | 'user', force: boolean) {
  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isDemo: users.isDemo,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!target) {
    console.error(`No account with the address ${email}. Run --list to see them.`);
    process.exitCode = 1;
    return;
  }

  if (target.deletedAt) {
    console.error(`${target.email} has been deleted.`);
    process.exitCode = 1;
    return;
  }

  /*
   * The demo account's password is published. Promoting it would hand every
   * visitor every other account on the instance, and there is no --force for
   * that: a flag implies a case where you might want it.
   */
  if (role === 'admin' && target.isDemo) {
    console.error(`${target.email} is the demo account — its password is published.`);
    process.exitCode = 1;
    return;
  }

  if (target.role === role) {
    console.log(
      `${target.email} is already ${role === 'admin' ? 'an administrator' : 'an ordinary user'}.`,
    );
    return;
  }

  if (role === 'user') {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'admin'), isNull(users.deletedAt)));

    if (admins.length <= 1 && !force) {
      console.error(
        `${target.email} is the only administrator. Grant the role to someone else first,\n` +
          `or pass --force to leave this instance without one.`,
      );
      process.exitCode = 1;
      return;
    }
  }

  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, target.id));
  console.log(
    role === 'admin'
      ? `${target.email} is now an administrator.`
      : `${target.email} is no longer an administrator.`,
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(USAGE);
    return;
  }

  if (args.includes('--list')) {
    await list();
    return;
  }

  const [command, rawEmail] = args.filter((arg) => !arg.startsWith('--'));
  const force = args.includes('--force');

  if (command !== 'grant' && command !== 'revoke') {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  if (!rawEmail) {
    console.error(`${command} needs an email address.\n\n${USAGE}`);
    process.exitCode = 1;
    return;
  }

  // The column is citext, so the comparison is case-insensitive either way;
  // lowercasing keeps the echoed output matching what sign-up stored.
  await setRole(rawEmail.trim().toLowerCase(), command === 'grant' ? 'admin' : 'user', force);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
