import { add, compare, isZero, subtract, toApiString, toDecimal, type MoneyInput } from './money';
/*
 * `splitEffect` moved to `lib/account-flow.ts`. Which side of a split an
 * account sits on is not a reconciliation question — the transactions page
 * needs the same answer, and was getting it wrong in the same way. Re-exported
 * so this module still reads as the one place reconciliation is defined.
 */
import { splitEffect } from './account-flow';
import type { Account, Transaction, TransactionType } from '@/server/firefly/types';

/**
 * E4-06 — reconciliation.
 *
 * Every number on the reconcile page is computed here, so the client's running
 * total and the Server Action's re-check run the same code on the same inputs
 * and cannot drift. Nothing in this file touches the network or React.
 *
 * ## What Firefly actually does
 *
 * Verified against a live 6.5.5 instance and against Firefly's own source
 * (`ReconcileController`, `Json\ReconcileController`, `AccountRepository`),
 * because the API spec documents none of it:
 *
 *   - Reconciliation is **asset accounts only**. `getReconciliation()` throws
 *     for anything else, and `config('firefly.expected_source_types')` allows
 *     the `reconciliation` transaction type between a Reconciliation account
 *     and an Asset account and no other pair. A credit card held as an asset
 *     account qualifies; a liability does not.
 *
 *   - The opening balance is the account's balance at the **end of the day
 *     before** the range starts, not on the start date itself.
 *
 *   - `difference = (opening + clearedTotal) − statementClosing`, i.e. what our
 *     books say the account should hold once the ticked items are counted,
 *     minus what the statement says it actually holds. Firefly writes the same
 *     sum as `(startBalance − endBalance) + clearedAmount + amount`.
 *
 *   - A positive difference means our books claim **more** money than the
 *     statement, so the correction moves money out: source = the asset account,
 *     destination = the reconciliation account. A negative difference is the
 *     mirror image. Both directions were posted against a live instance and the
 *     resulting balances checked.
 *
 *   - The holding account is named `"<account> reconciliation (<CUR>)"` and is
 *     created lazily by Firefly's own web UI. **It cannot be created over the
 *     API**: `POST /accounts` only accepts asset/expense/revenue/cash/liability,
 *     and the two "omit one side and let Firefly fill it in" shapes that the
 *     validator appears to allow both fail on 6.5.5 — omitting the destination
 *     returns `422 Created zero transaction journals`, omitting the source
 *     returns a `500`. So a correction can only be written when the holding
 *     account already exists, which `correctionPlan` reports rather than
 *     guesses at.
 */

export { splitEffect };

/** Firefly's own template: `firefly.reconciliation_account_name`. */
export function reconciliationAccountName(accountName: string, currencyCode: string): string {
  return `${accountName} reconciliation (${currencyCode})`;
}

/**
 * Find the holding account Firefly would use for this asset account.
 *
 * Matched on the name Firefly generates rather than on any link, because the
 * API exposes no relationship between the two. Comparison is case- and
 * whitespace-insensitive for the same reason `lib/bill-rules.ts` is: Firefly
 * preserves whatever the user typed, and a stray double space would otherwise
 * silently mean "no holding account" and disable the correction.
 */
export function findReconciliationAccount(
  accounts: Account[],
  accountName: string,
  currencyCode: string,
): Account | null {
  const wanted = normalise(reconciliationAccountName(accountName, currencyCode));
  return (
    accounts.find(
      (candidate) =>
        candidate.attributes.type === 'reconciliation' &&
        normalise(candidate.attributes.name) === wanted,
    ) ?? null
  );
}

const normalise = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

/** Reconciliation is defined for asset accounts and nothing else. */
export function isReconcilable(account: Account): boolean {
  return account.attributes.type === 'asset';
}

export interface ReconcileRow {
  /** The split's journal id — the unit Firefly marks reconciled. */
  journalId: string;
  /** The group it belongs to, needed to PUT every sibling split back. */
  groupId: string;
  type: TransactionType;
  date: string;
  description: string;
  /** The other side of the transaction, from this account's point of view. */
  counterparty: string;
  /** Always positive — the magnitude shown in the amount column. */
  amount: string;
  /** Signed effect on this account: negative when money left it. */
  effect: string;
  /** Already reconciled in Firefly when the page loaded. */
  reconciled: boolean;
  /**
   * Firefly locks the amount of a reconciled split, and the correction rows it
   * writes are its own bookkeeping. Both are shown, neither is editable here.
   */
  system: boolean;
}

export interface ReconcileRowsResult {
  rows: ReconcileRow[];
  /**
   * Rows whose amount is in a currency this account does not hold. They are
   * listed but cannot be counted, and the page has to say so — silently
   * treating them as zero would make a wrong difference look authoritative.
   */
  unconvertible: ReconcileRow[];
}

/**
 * Flatten transaction groups into one row per split that touches this account.
 *
 * A group can hold several splits, and a split can name accounts this one is
 * not part of, so the filter matters: a three-way split where only one leg hits
 * the current account must contribute that leg and nothing else.
 */
export function buildReconcileRows(
  groups: Transaction[],
  accountId: string,
  currencyCode: string,
  decimals = 2,
): ReconcileRowsResult {
  const rows: ReconcileRow[] = [];
  const unconvertible: ReconcileRow[] = [];

  for (const group of groups) {
    for (const split of group.attributes.transactions) {
      const touches = split.source_id === accountId || split.destination_id === accountId;
      if (!touches) continue;

      const {
        effect,
        amount,
        unconvertible: bad,
      } = splitEffect(split, accountId, currencyCode, decimals);
      const isDestination = split.destination_id === accountId;

      const row: ReconcileRow = {
        journalId: split.transaction_journal_id,
        groupId: group.id,
        type: split.type,
        date: split.date.slice(0, 10),
        description: split.description,
        counterparty:
          (isDestination ? split.source_name : split.destination_name) ?? '(unnamed account)',
        amount,
        effect,
        reconciled: split.reconciled,
        system: split.type === 'reconciliation' || split.type === 'opening balance',
      };

      rows.push(row);
      if (bad) unconvertible.push(row);
    }
  }

  // Newest first, matching every other transaction list in the app. Ties break
  // on journal id so the order is stable across reloads rather than left to
  // however Firefly happened to page the results.
  rows.sort((a, b) => b.date.localeCompare(a.date) || b.journalId.localeCompare(a.journalId));
  return { rows, unconvertible };
}

/** Sum the signed effect of a chosen set of rows. */
export function clearedTotal(
  rows: ReconcileRow[],
  selected: ReadonlySet<string>,
  decimals = 2,
): string {
  return toApiString(
    add(...rows.filter((row) => selected.has(row.journalId)).map((row) => row.effect)),
    decimals,
  );
}

export interface ReconcileMath {
  /** Balance at the end of the day before the range began. */
  opening: string;
  /** Net effect of everything ticked. */
  cleared: string;
  /** What our books therefore say the account holds on the closing date. */
  computed: string;
  /** What the statement says it holds. */
  statement: string;
  /** `computed − statement`. Positive means our books claim too much. */
  difference: string;
  balanced: boolean;
}

export function reconcileMath({
  opening,
  cleared,
  statement,
  decimals = 2,
}: {
  opening: MoneyInput;
  cleared: MoneyInput;
  statement: MoneyInput;
  decimals?: number;
}): ReconcileMath {
  const computed = add(opening, cleared);
  // Rounded before the comparison, not after: an account carried to two places
  // whose raw balances differ in the sixth is balanced, and a difference tile
  // reading "0.00" beside a banner saying it is out by 0.0000004 is a bug
  // report waiting to happen.
  const difference = subtract(
    toApiString(computed, decimals),
    toApiString(toDecimal(statement), decimals),
  );
  return {
    opening: toApiString(opening, decimals),
    cleared: toApiString(cleared, decimals),
    computed: toApiString(computed, decimals),
    statement: toApiString(statement, decimals),
    difference: toApiString(difference, decimals),
    balanced: isZero(difference),
  };
}

export interface CorrectionPlan {
  /** `drain` removes money from the asset account; `fill` adds it. */
  direction: 'drain' | 'fill';
  /** Always positive — Firefly takes the magnitude and infers sign from sides. */
  amount: string;
  sourceId: string;
  destinationId: string;
  description: string;
}

/**
 * The correcting transaction that closes a non-zero difference, or `null` when
 * there is nothing to correct.
 *
 * Returns a plan rather than writing anything so the page can show exactly what
 * it is about to do — "€12.40 will be taken out of Everyday Current" — before
 * the user commits to it.
 */
export function correctionPlan({
  difference,
  assetAccountId,
  reconciliationAccountId,
  start,
  end,
  decimals = 2,
}: {
  difference: MoneyInput;
  assetAccountId: string;
  reconciliationAccountId: string;
  start: string;
  end: string;
  decimals?: number;
}): CorrectionPlan | null {
  if (isZero(difference)) return null;
  const overstated = compare(difference, '0') > 0;

  return {
    direction: overstated ? 'drain' : 'fill',
    amount: toApiString(toDecimal(difference).abs(), decimals),
    sourceId: overstated ? assetAccountId : reconciliationAccountId,
    destinationId: overstated ? reconciliationAccountId : assetAccountId,
    // Firefly's own wording (`firefly.reconciliation_transaction_title`), so a
    // correction written here is indistinguishable from one written there.
    description: `Reconciliation (${start} to ${end})`,
  };
}

/**
 * Which groups need writing, and what each of their journals should end up as.
 *
 * Deliberately returns intent rather than a payload. A
 * `PUT /transactions/{id}` whose `transactions` array omits a split **deletes
 * that split** — measured on 6.5.5, where a two-leg group PUT with a single
 * `transaction_journal_id` came back holding one leg with the other gone. The
 * rows here only cover splits that touch the account being reconciled, so a
 * group whose other legs sit on different accounts is not fully represented and
 * a payload built from them would delete those legs. The caller re-reads each
 * group and applies `desired` over the splits it finds, leaving anything absent
 * from the map exactly as Firefly has it.
 */
export function planReconciledWrites(
  rows: ReconcileRow[],
  selected: ReadonlySet<string>,
): Array<{ groupId: string; desired: Map<string, boolean> }> {
  const byGroup = new Map<string, ReconcileRow[]>();
  for (const row of rows) {
    const bucket = byGroup.get(row.groupId);
    if (bucket) bucket.push(row);
    else byGroup.set(row.groupId, [row]);
  }

  const writes: Array<{ groupId: string; desired: Map<string, boolean> }> = [];

  for (const [groupId, groupRows] of byGroup) {
    const changed = groupRows.filter((row) => row.reconciled !== selected.has(row.journalId));
    if (changed.length === 0) continue;
    writes.push({
      groupId,
      // Every row of the group we know about, not only the changed ones: the
      // unchanged siblings still have to be sent back with their current flag,
      // and sending their true value is how they survive the round trip.
      desired: new Map(groupRows.map((row) => [row.journalId, selected.has(row.journalId)])),
    });
  }

  return writes;
}

/**
 * How many rows the submit would reconcile, and how many it would UNreconcile.
 *
 * One `pendingWrites` count could not tell the two apart, and unticking a whole
 * month then reported "Reconciled 12 transactions" for a submit that did the
 * exact opposite. The write was right and the sentence describing it was a lie,
 * which on a page about making the books true is the wrong place to be loose.
 */
export function countChanges(
  rows: ReconcileRow[],
  selected: ReadonlySet<string>,
): { reconcile: number; unreconcile: number; total: number } {
  let reconcile = 0;
  let unreconcile = 0;
  for (const row of rows) {
    const wanted = selected.has(row.journalId);
    if (wanted && !row.reconciled) reconcile += 1;
    else if (!wanted && row.reconciled) unreconcile += 1;
  }
  return { reconcile, unreconcile, total: reconcile + unreconcile };
}

/** "Reconciled 3", "Unreconciled 2", or both — whatever actually happened. */
export function describeChanges(counts: { reconcile: number; unreconcile: number }): string {
  const parts: string[] = [];
  if (counts.reconcile > 0)
    parts.push(`reconciled ${counts.reconcile} transaction${counts.reconcile === 1 ? '' : 's'}`);
  if (counts.unreconcile > 0)
    parts.push(
      `unreconciled ${counts.unreconcile} transaction${counts.unreconcile === 1 ? '' : 's'}`,
    );
  if (parts.length === 0) return 'Nothing to change — every line already matched Firefly.';
  return `${parts.join(' and ')[0]!.toUpperCase()}${parts.join(' and ').slice(1)}.`;
}

/**
 * The set that should be ticked when the page first renders: everything Firefly
 * already considers reconciled.
 */
export function initialSelection(rows: ReconcileRow[]): Set<string> {
  return new Set(rows.filter((row) => row.reconciled).map((row) => row.journalId));
}

/**
 * Read the closing balance someone typed or pasted from a bank statement.
 *
 * This exists because `toDecimal` answers 0 for anything it cannot parse, and 0
 * is a plausible bank balance. A pasted "1.234,56" would have been read as zero
 * and reported as a €1,234.56 difference the user would then "correct" by
 * writing a transaction for money that never moved. Refusing to guess is the
 * whole point: every return is either a number this function is sure of, or an
 * error naming what it could not read.
 *
 * Separators are resolved by position rather than by locale, because the locale
 * of the browser says nothing about the locale of the bank:
 *   - both separators present → the LAST one is the decimal point;
 *   - one comma with exactly one or two digits after it → a decimal comma
 *     ("1,5" is 1.5 in every place that writes it that way, and 15 in none);
 *   - anything else → a thousands separator.
 */
export function parseStatementInput(raw: string): { value: string; error: string | null } {
  const trimmed = raw.trim().replace(/\s| |'/g, '');
  if (trimmed === '') return { value: '', error: 'Enter the closing balance from your statement.' };

  const sign = trimmed.startsWith('-') ? '-' : '';
  const body = trimmed.replace(/^[+-]/, '');
  if (body === '') return { value: '', error: 'That is a sign with no number after it.' };

  const lastDot = body.lastIndexOf('.');
  const lastComma = body.lastIndexOf(',');

  let normalised: string;
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalAt = Math.max(lastDot, lastComma);
    normalised = `${body.slice(0, decimalAt).replace(/[.,]/g, '')}.${body.slice(decimalAt + 1)}`;
  } else if (lastComma >= 0) {
    const decimalComma =
      body.indexOf(',') === lastComma && /^,\d{1,2}$/.test(body.slice(lastComma));
    normalised = decimalComma
      ? `${body.slice(0, lastComma)}.${body.slice(lastComma + 1)}`
      : body.replace(/,/g, '');
  } else if (lastDot >= 0 && body.indexOf('.') !== lastDot) {
    // Several dots and no comma: they are all thousands separators.
    normalised = body.replace(/\./g, '');
  } else {
    normalised = body;
  }

  if (!/^\d+(\.\d+)?$/.test(normalised)) {
    return { value: '', error: `"${raw.trim()}" is not an amount.` };
  }

  return { value: `${sign}${normalised}`, error: null };
}
