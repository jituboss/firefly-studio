'use server';

import { requireSession } from '@/server/auth/session';
import { updateConnectionPrimaryCurrency } from '@/server/connections';
import {
  fireflyGet,
  fireflyWrite,
  requireActiveConnection,
  FireflyRequestError,
} from '@/server/firefly/api';
import { invalidateTags } from '@/server/firefly/cache';
import type { Paged, Resource } from '@/server/firefly/types';
import { loadAccounts, loadLists } from '@/server/import/firefly';
import { now, toApiDate } from '@/lib/date';
import {
  accountPayload,
  budgetPayload,
  monthBounds,
  validateSetup,
  type SetupInput,
} from '@/lib/setup';

export interface SetupResult {
  ok: boolean;
  /** Refusals before anything was written. */
  problems?: string[];
  created?: {
    currency: string | null;
    accounts: string[];
    budgets: string[];
    categories: string[];
    payer: string | null;
  };
  /** Things that already existed and were left as they were. */
  kept?: string[];
  /** Individual writes Firefly refused; everything else still went through. */
  failed?: string[];
}

const message = (error: unknown) =>
  error instanceof FireflyRequestError ? error.message : 'Unexpected error.';

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Apply the first-run setup to the active ledger.
 *
 * Runs each step in order and keeps going past a refusal: one budget Firefly
 * rejects should not cost someone the four accounts that worked, so failures
 * are reported per item and the result says exactly what exists now. Anything
 * already in the ledger under the same name is kept, never duplicated, which
 * also makes running the setup twice harmless.
 */
export async function runSetupAction(input: SetupInput): Promise<SetupResult> {
  const session = await requireSession();
  const connection = await requireActiveConnection();

  const problems = validateSetup(input);
  if (problems.length > 0) return { ok: false, problems };

  const today = toApiDate(now(session.user.timezone), session.user.timezone);
  const failed: string[] = [];
  const kept: string[] = [];
  const created = {
    currency: null as string | null,
    accounts: [] as string[],
    budgets: [] as string[],
    categories: [] as string[],
    payer: null as string | null,
  };

  // 1. Currency first: accounts and budgets are created in it.
  if (input.currency !== connection.primaryCurrency) {
    try {
      await fireflyWrite(`/v1/currencies/${input.currency}/primary`, 'POST', {});
      await updateConnectionPrimaryCurrency(connection.id, input.currency);
      created.currency = input.currency;
    } catch (error) {
      return {
        ok: false,
        problems: [`Firefly would not switch to ${input.currency}: ${message(error)}`],
      };
    }
  }

  let existing: Awaited<ReturnType<typeof loadAccounts>>;
  let lists: Awaited<ReturnType<typeof loadLists>>;
  try {
    [existing, lists] = await Promise.all([loadAccounts(), loadLists()]);
  } catch (error) {
    return { ok: false, problems: [`Could not read your ledger: ${message(error)}`] };
  }

  // 2. Accounts.
  for (const account of input.accounts.filter((entry) => entry.enabled)) {
    const name = account.name.trim();
    if (
      existing.some(
        (entry) => same(entry.name, name) && entry.kind !== 'expense' && entry.kind !== 'revenue',
      )
    ) {
      kept.push(name);
      continue;
    }
    try {
      await fireflyWrite('/v1/accounts', 'POST', accountPayload(account, input.currency, today));
      created.accounts.push(name);
    } catch (error) {
      failed.push(`${name}: ${message(error)}`);
    }
  }

  // 3. Who pays you — so the first salary has somewhere to come from, and the
  //    name autocompletes in every form from day one.
  const payer = input.income.from.trim();
  if (payer && !existing.some((entry) => entry.kind === 'revenue' && same(entry.name, payer))) {
    try {
      await fireflyWrite('/v1/accounts', 'POST', { name: payer, type: 'revenue' });
      created.payer = payer;
    } catch (error) {
      failed.push(`${payer}: ${message(error)}`);
    }
  }

  // 4. Budgets, each with this month's limit in place now. The auto-budget
  //    carries it into later months; Firefly only fills the current one in on
  //    its own schedule, so a fresh ledger would open on an empty plan.
  const { start, end } = monthBounds(today);
  for (const budget of input.budgets.filter((entry) => entry.enabled)) {
    const name = budget.name.trim();
    if (lists.budgets.some((entry) => same(entry, name))) {
      kept.push(name);
      continue;
    }
    try {
      const payload = budgetPayload(budget, input.currency);
      const made = await fireflyWrite<{ data: { id: string } }>('/v1/budgets', 'POST', payload);
      created.budgets.push(name);
      if (payload.auto_budget_amount) {
        const limits = await fireflyGet<Paged<Resource<unknown>>>(
          `/v1/budgets/${made.data.id}/limits?start=${start}&end=${end}`,
          { noCache: true },
        );
        if (limits.data.length === 0) {
          await fireflyWrite(`/v1/budgets/${made.data.id}/limits`, 'POST', {
            start,
            end,
            amount: payload.auto_budget_amount,
            currency_code: input.currency,
          });
        }
      }
    } catch (error) {
      failed.push(`${name}: ${message(error)}`);
    }
  }

  // 5. Categories to match: the words people reach for when filing a spend,
  //    ready in every category picker before the first transaction exists.
  const categoryNames = [
    ...input.budgets.filter((entry) => entry.enabled).map((entry) => entry.name.trim()),
    ...(input.income.amount.trim() || payer ? ['Salary'] : []),
  ];
  for (const name of [...new Set(categoryNames)]) {
    if (!name || lists.categories.some((entry) => same(entry, name))) continue;
    try {
      await fireflyWrite('/v1/categories', 'POST', { name });
      created.categories.push(name);
    } catch (error) {
      failed.push(`${name}: ${message(error)}`);
    }
  }

  await invalidateTags(connection.id, [
    'accounts',
    'budgets',
    'categories',
    'currencies',
    'summary',
    'insight',
    'charts',
  ]);
  // No revalidatePath: the wizard navigates to the dashboard itself, and a
  // revalidation here would append a re-rendered page to this action's
  // response (the hang documented on quickAddTransactionAction).
  return { ok: true, created, kept, failed };
}
