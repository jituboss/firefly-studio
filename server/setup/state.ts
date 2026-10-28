import 'server-only';
import { getActiveConnection } from '@/server/firefly/api';
import { managedConfig } from '@/server/managed-firefly';
import { loadAccounts } from '@/server/import/firefly';
import { isOwn } from '@/lib/account-matrix';

/**
 * Does the active ledger still need its first-run setup?
 *
 * Derived, not stored: a ledger needs setting up while it has no account of
 * your own in it. That needs no flag to keep in sync, it is right for a ledger
 * someone emptied by hand, and it stops asking the moment the setup — or an
 * import, or the Accounts page — creates the first one.
 */
export async function setupStatus(): Promise<{ needed: boolean; managed: boolean }> {
  const connection = await getActiveConnection();
  if (!connection) return { needed: false, managed: false };
  const managed = managedConfig()?.baseUrl === connection.baseUrl;
  try {
    const accounts = await loadAccounts();
    return { needed: !accounts.some((account) => isOwn(account.kind)), managed };
  } catch {
    // An unreachable ledger is a connection problem, not an empty one.
    return { needed: false, managed };
  }
}
