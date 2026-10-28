import 'server-only';
import { fireflyGet } from '@/server/firefly/api';
import type { Account, Currency, Paged, Resource, Transaction } from '@/server/firefly/types';
import { kindFromFirefly } from '@/lib/account-matrix';
import { fingerprintKey, type ExistingAccount, type LedgerLists } from '@/lib/import/plan';

/**
 * The reads an import needs, all uncached: an import decides what to create
 * and what is a duplicate from these, and a cached answer from before the last
 * import would let the same file import twice.
 */

const PAGE_SIZE = 100;

async function allPages<T>(
  path: string,
  maxPages: number,
): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  const join = path.includes('?') ? '&' : '?';
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fireflyGet<Paged<T>>(`${path}${join}limit=${PAGE_SIZE}&page=${page}`, {
      noCache: true,
    });
    items.push(...response.data);
    const pagination = response.meta.pagination;
    if (!pagination || page >= (pagination.total_pages ?? 1)) return { items, truncated: false };
  }
  return { items, truncated: true };
}

/** Every account an import can resolve a name to, archived ones included. */
export async function loadAccounts(): Promise<ExistingAccount[]> {
  const { items } = await allPages<Account>('/v1/accounts?type=all', 50);
  return items.flatMap((account) => {
    const kind = kindFromFirefly(account.attributes.type, account.attributes.liability_type);
    if (!kind) return [];
    return [
      {
        id: account.id,
        name: account.attributes.name,
        kind,
        active: account.attributes.active,
        currency: account.attributes.currency_code,
      },
    ];
  });
}

export async function loadCurrencies(): Promise<string[]> {
  const { items } = await allPages<Currency>('/v1/currencies', 5);
  return items.filter((currency) => currency.attributes.enabled).map((c) => c.attributes.code);
}

/**
 * The ledger's categories, budgets and tags, so the import reuses them by name
 * instead of creating near-duplicates. Tags carry their name in `tag`.
 */
export async function loadLists(): Promise<LedgerLists> {
  const [categories, budgets, tags] = await Promise.all([
    allPages<Resource<{ name: string }>>('/v1/categories', 20),
    allPages<Resource<{ name: string }>>('/v1/budgets', 20),
    allPages<Resource<{ tag: string }>>('/v1/tags', 50),
  ]);
  return {
    categories: categories.items.map((item) => item.attributes.name),
    budgets: budgets.items.map((item) => item.attributes.name),
    tags: tags.items.map((item) => item.attributes.tag),
  };
}

/**
 * Fingerprint every split in the ledger between two dates, counted.
 *
 * `truncated` is reported rather than swallowed: past the page cap some
 * existing transactions were not compared, and the preview says so instead of
 * implying the duplicate check was complete.
 */
export async function loadLedgerCounts(
  start: string,
  end: string,
): Promise<{ counts: Record<string, number>; truncated: boolean }> {
  const { items, truncated } = await allPages<Transaction>(
    `/v1/transactions?type=all&start=${start}&end=${end}`,
    100,
  );
  const counts: Record<string, number> = {};
  for (const group of items) {
    for (const split of group.attributes.transactions) {
      if (!split.source_id || !split.destination_id) continue;
      const key = fingerprintKey(
        split.date.slice(0, 10),
        split.amount,
        split.source_id,
        split.destination_id,
      );
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return { counts, truncated };
}
