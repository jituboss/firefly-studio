'use server';

import { revalidatePath } from 'next/cache';
import { fireflyWrite, FireflyRequestError } from './api';
import {
  getAccount,
  getAccountBalanceOn,
  getAllAccountTransactions,
  getReconciliationAccounts,
  getTransaction,
} from './queries';
import {
  buildReconcileRows,
  clearedTotal,
  correctionPlan,
  countChanges,
  describeChanges,
  findReconciliationAccount,
  isReconcilable,
  parseStatementInput,
  planReconciledWrites,
  reconcileMath,
  reconciliationAccountName,
} from '@/lib/reconcile';
import { previousDay } from '@/lib/date-range';

/**
 * E4-06 — the reconciliation write path.
 *
 * Two things happen here and they are deliberately ordered: the ticked
 * transactions are marked reconciled FIRST, and only then is a correcting
 * transaction written. If the correction fails, the reconciling has still
 * happened and is reported, because re-ticking forty rows to retry a correction
 * is a worse outcome than a correction the user can write again.
 *
 * Nothing the client sends about money is trusted. The browser computes the
 * running difference so the tile updates the instant a box is ticked, but that
 * number is a display; this re-reads the range from Firefly and recomputes the
 * whole sum with the same `lib/reconcile` functions before writing anything. A
 * stale tab, a transaction edited in another window, or a hand-forged POST all
 * land on the server's arithmetic rather than the browser's.
 */

export interface ReconcileState {
  error?: string;
  notice?: string;
  ok?: boolean;
  /** Set when the books balanced and nothing needed correcting. */
  balanced?: boolean;
}

export async function reconcileAction(
  _prev: ReconcileState,
  formData: FormData,
): Promise<ReconcileState> {
  const accountId = String(formData.get('accountId') ?? '');
  const start = String(formData.get('start') ?? '');
  const end = String(formData.get('end') ?? '');
  const statement = String(formData.get('statement') ?? '').trim();
  const wantsCorrection = formData.get('correct') === 'on';
  const selected = new Set(formData.getAll('journal').map(String).filter(Boolean));

  if (!accountId || !start || !end) return { error: 'Missing account or date range.' };

  // Parsed, not coerced. `toDecimal` answers 0 for anything it cannot read and
  // 0 is a plausible balance, so a pasted "1.234,56" that fell through would
  // become a €1,234.56 difference and then a correction for money that never
  // moved.
  const parsedStatement = parseStatementInput(statement);
  if (parsedStatement.error) return { error: parsedStatement.error };

  // The range is normalised here as well as in the page: an inverted pair asks
  // Firefly for an empty set, which would present as "everything is missing".
  const [from, to] = start <= end ? [start, end] : [end, start];

  let account;
  try {
    account = (await getAccount(accountId)).data;
  } catch {
    return { error: 'That account no longer exists.' };
  }

  if (!isReconcilable(account)) {
    return { error: 'Only asset accounts can be reconciled.' };
  }

  const currency = account.attributes.currency_code ?? '';
  const decimals = account.attributes.currency_decimal_places ?? 2;

  /*
   * Read past the cache. The whole point of recomputing here is that the
   * browser's figure might be stale, and re-deriving it from a 30-second-old
   * cached copy of the same range would reproduce the staleness it exists to
   * catch — including a transaction the user just edited in Firefly's own UI in
   * the other tab.
   */
  let openingResponse;
  let range;
  try {
    [openingResponse, range] = await Promise.all([
      getAccountBalanceOn(accountId, previousDay(from), { noCache: true }),
      getAllAccountTransactions(accountId, from, to, { noCache: true }),
    ]);
  } catch {
    return { error: 'Firefly could not be reached, so nothing was changed. Try again.' };
  }

  if (range.truncated) {
    return {
      error:
        'This range holds more transactions than one reconciliation can cover. Narrow the dates and try again.',
    };
  }

  const { rows, unconvertible } = buildReconcileRows(range.groups, accountId, currency, decimals);

  // A ticked id that is no longer in the range means the underlying data moved
  // while the page was open. Refusing is the only safe answer: reconciling the
  // rest would balance against a list the user never saw.
  const known = new Set(rows.map((row) => row.journalId));
  const stale = [...selected].filter((id) => !known.has(id));
  if (stale.length > 0) {
    return {
      error:
        'These transactions changed while you were working. Reload the page and reconcile again.',
    };
  }

  if (unconvertible.length > 0 && wantsCorrection) {
    return {
      error: `${unconvertible.length} transaction${
        unconvertible.length === 1 ? ' is' : 's are'
      } in a currency this account does not hold, so the difference cannot be trusted. Reconcile without a correction, or fix those amounts in Firefly first.`,
    };
  }

  const opening = openingResponse.data.attributes.current_balance ?? '0';
  const math = reconcileMath({
    opening,
    cleared: clearedTotal(rows, selected, decimals),
    statement: parsedStatement.value,
    decimals,
  });

  // --- 1. the reconciled flags ---------------------------------------------

  const counts = countChanges(rows, selected);
  const writes = planReconciledWrites(rows, selected);
  const results = await Promise.allSettled(
    writes.map(async ({ groupId, desired }) => {
      /*
       * Re-read the group and resend every split it holds.
       *
       * A PUT whose `transactions` array omits a split DELETES that split —
       * measured on 6.5.5, where a two-leg group PUT with one journal id came
       * back holding one leg. The rows on screen only cover legs that touch
       * THIS account, so a split transaction with legs on two accounts is not
       * fully represented by them and a payload built from the rows alone would
       * destroy the other leg. `desired` is applied over what Firefly actually
       * has, and any split it does not mention keeps its current flag.
       */
      const group = (await getTransaction(groupId)).data;
      const splits = group.attributes.transactions;
      return fireflyWrite(`/v1/transactions/${groupId}`, 'PUT', {
        ...(splits.length > 1
          ? { group_title: group.attributes.group_title ?? 'Split transaction' }
          : {}),
        transactions: splits.map((split) => ({
          transaction_journal_id: split.transaction_journal_id,
          reconciled: desired.get(split.transaction_journal_id) ?? split.reconciled,
        })),
      });
    }),
  );

  const failed = results.filter((result) => result.status === 'rejected');
  const marked = results.length - failed.length;

  revalidatePath(`/accounts/${accountId}`);
  revalidatePath('/transactions');
  revalidatePath('/dashboard');

  if (failed.length > 0 && marked === 0) {
    return { error: firstReason(failed, 'Firefly refused the change.') };
  }

  /*
   * Reported by DIRECTION, not by a single count. Unticking a whole month and
   * saving used to answer "Reconciled 12 transactions" for a submit that
   * unreconciled all twelve — the write was right and the sentence describing
   * it was not, which is the wrong thing to be loose about on a page whose
   * entire job is making the books true.
   */
  const markedNote =
    failed.length > 0 && writes.length > 0
      ? `Saved ${marked} of ${writes.length} transaction groups.`
      : describeChanges(counts);

  const partialNote =
    failed.length > 0 ? ` ${failed.length} could not be saved; reload and retry those.` : '';

  // --- 2. the correction ----------------------------------------------------

  if (math.balanced) {
    return {
      ok: true,
      balanced: true,
      notice: `${markedNote}${partialNote} The account balances.`,
    };
  }

  if (!wantsCorrection) {
    const gap = math.difference.startsWith('-') ? math.difference.slice(1) : math.difference;
    return {
      ok: true,
      notice:
        `${markedNote}${partialNote} The account is still out by ${gap} ${currency} — ` +
        `your books have ${math.difference.startsWith('-') ? 'less' : 'more'} than the statement. ` +
        'No correction was written.',
    };
  }

  const holding = findReconciliationAccount(
    (await getReconciliationAccounts({ noCache: true })).data,
    account.attributes.name,
    currency,
  );

  if (!holding) {
    /*
     * Firefly's API cannot create this account. `POST /accounts` accepts only
     * asset/expense/revenue/cash/liability, and the two payload shapes that let
     * Firefly create it implicitly both fail on 6.5.5 — omitting the
     * destination returns 422 "Created zero transaction journals", omitting the
     * source returns a 500. Firefly's own web UI makes it on the first
     * reconciliation that needs it, so that is what we send people to do,
     * ONCE. Saying so beats a 500 the user cannot act on.
     */
    return {
      ok: true,
      notice: `${markedNote}${partialNote} The correction could not be written: Firefly has not yet created its "${reconciliationAccountName(
        account.attributes.name,
        currency,
      )}" holding account, and its API provides no way to create one. Reconcile this account once in Firefly itself to create it — after that, corrections work here.`,
    };
  }

  const plan = correctionPlan({
    difference: math.difference,
    assetAccountId: accountId,
    reconciliationAccountId: holding.id,
    start: from,
    end: to,
    decimals,
  });

  if (!plan) return { ok: true, balanced: true, notice: `${markedNote}${partialNote}` };

  try {
    await fireflyWrite('/v1/transactions', 'POST', {
      transactions: [
        {
          type: 'reconciliation',
          date: to,
          amount: plan.amount,
          description: plan.description,
          source_id: plan.sourceId,
          destination_id: plan.destinationId,
          currency_code: currency,
          // Firefly's own UI marks the correction reconciled on creation, so it
          // is never offered for ticking in the next period.
          reconciled: true,
        },
      ],
    });
  } catch (caught) {
    const detail =
      caught instanceof FireflyRequestError ? caught.message : 'Firefly refused the correction.';
    return {
      ok: true,
      notice: `${markedNote}${partialNote} The correction of ${plan.amount} ${currency} was not written: ${detail}`,
    };
  }

  revalidatePath(`/accounts/${accountId}`);
  revalidatePath('/transactions');
  revalidatePath('/dashboard');

  const movement =
    plan.direction === 'drain'
      ? `taking ${plan.amount} ${currency} out of`
      : `adding ${plan.amount} ${currency} to`;

  return {
    ok: true,
    balanced: true,
    notice: `${markedNote}${partialNote} Balanced by ${movement} ${account.attributes.name}.`,
  };
}

function firstReason(failed: PromiseSettledResult<unknown>[], fallback: string): string {
  const first = failed[0];
  if (first && first.status === 'rejected' && first.reason instanceof FireflyRequestError) {
    return first.reason.message;
  }
  return fallback;
}
