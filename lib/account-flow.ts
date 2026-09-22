import { add, toApiString, toDecimal, type Decimal } from './money';
import type { TransactionSplit } from '@/server/firefly/types';

/**
 * Which way money moved, from one account's point of view.
 *
 * **Transaction type does not answer this question, and assuming it does is a
 * bug this app shipped.** Firefly names a transaction for what it is to the
 * ledger, not for what it is to the account you happen to be looking at, and
 * the two differ most on a credit card. Paying a card off from a current
 * account is a `withdrawal` — `config('firefly.source_dests')` allows
 * ASSET → DEBT for withdrawals and does not allow a transfer between them at
 * all — so the card's own transaction list contains two withdrawals that move
 * money in opposite directions:
 *
 *   withdrawal  168,000  Everyday Current → EBL Visa   (money INTO the card)
 *   withdrawal    3,653  EBL Visa → FIRSTTRIP          (money OUT of the card)
 *
 * Counting every withdrawal as spending made the card's totals read
 * "out 171,653, net −171,653" for a month that actually ran 168,000 in and
 * 3,653 out. The only reliable signal is which SIDE of the split the account
 * sits on, which is what this module reads.
 */

export type FlowDirection = -1 | 0 | 1;

export interface SplitFlow {
  /** `1` into the account, `-1` out of it, `0` if the split does not touch it. */
  direction: FlowDirection;
  /** Unrounded magnitude in the account's currency, or `0` when unconvertible. */
  magnitude: Decimal;
  /**
   * The split is denominated in a currency this account does not hold, and
   * carries no foreign amount in it either. Counted as nothing, and reported
   * so the caller can say so rather than quietly under-count.
   */
  unconvertible: boolean;
}

/**
 * One split's effect on one account, at full precision.
 *
 * Firefly reports `amount` as a positive magnitude and expresses direction
 * through `source_id`/`destination_id`, so the sign has to be derived. When the
 * split is denominated in another currency but carries a foreign amount in
 * ours, the foreign amount is the one that moved this account — the same choice
 * Firefly's own `processJournal` makes.
 */
export function splitFlow(
  split: TransactionSplit,
  accountId: string,
  currencyCode: string,
): SplitFlow {
  const direction: FlowDirection =
    split.source_id === accountId ? -1 : split.destination_id === accountId ? 1 : 0;

  if (direction === 0) {
    return { direction: 0, magnitude: toDecimal(0), unconvertible: false };
  }

  const magnitude =
    split.currency_code === currencyCode
      ? split.amount
      : split.foreign_currency_code === currencyCode && split.foreign_amount !== null
        ? split.foreign_amount
        : null;

  if (magnitude === null) {
    return { direction, magnitude: toDecimal(0), unconvertible: true };
  }

  return { direction, magnitude: toDecimal(magnitude).abs(), unconvertible: false };
}

/**
 * One split's signed effect on an account, rounded for display.
 *
 * Kept as a separate entry point from `splitFlow` because a running total must
 * sum at full precision and round once at the end: rounding each of forty
 * splits and then adding them is how a reconciliation ends up a cent out.
 */
export function splitEffect(
  split: TransactionSplit,
  accountId: string,
  currencyCode: string,
  decimals = 2,
): { effect: string; amount: string; unconvertible: boolean } {
  const flow = splitFlow(split, accountId, currencyCode);
  if (flow.direction === 0) return { effect: '0', amount: '0', unconvertible: false };
  if (flow.unconvertible) {
    return { effect: '0', amount: toApiString(split.amount, decimals), unconvertible: true };
  }

  return {
    effect: toApiString(
      flow.direction === -1 ? flow.magnitude.negated() : flow.magnitude,
      decimals,
    ),
    amount: toApiString(flow.magnitude, decimals),
    unconvertible: false,
  };
}

export interface AccountFlowTotals {
  inflow: string;
  outflow: string;
  net: string;
  /** Splits left out because their currency could not be resolved to this one. */
  unconvertible: number;
}

/**
 * In, out and net for one account, over a set of splits.
 *
 * Every split that touches the account counts, whatever Firefly calls it — a
 * transfer between two of your own accounts is still money leaving one of them,
 * and on a liability the same `withdrawal` type covers both a purchase and a
 * repayment. Splits that do not touch the account contribute nothing, which is
 * what makes this safe to run over a list that was filtered by something else.
 */
export function accountFlowTotals(
  splits: TransactionSplit[],
  accountId: string,
  currencyCode: string,
): AccountFlowTotals {
  const inflows: Decimal[] = [];
  const outflows: Decimal[] = [];
  let unconvertible = 0;

  for (const split of splits) {
    const flow = splitFlow(split, accountId, currencyCode);
    if (flow.direction === 0) continue;
    if (flow.unconvertible) {
      unconvertible += 1;
      continue;
    }
    if (flow.direction === 1) inflows.push(flow.magnitude);
    else outflows.push(flow.magnitude);
  }

  const inflow = add(...inflows);
  const outflow = add(...outflows);

  return {
    inflow: inflow.toString(),
    outflow: outflow.toString(),
    net: inflow.minus(outflow).toString(),
    unconvertible,
  };
}
