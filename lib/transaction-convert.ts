/**
 * E5-19 — converting a transaction between withdrawal, deposit and transfer.
 *
 * Firefly III has no convert endpoint. Its own web UI has the feature, but the
 * API does it through `PUT /transactions/{id}` with a changed `type` — and the
 * rules around that are not in the OpenAPI spec. Everything below was
 * established by making real calls against 6.5.5 (docs/LEARNING.md §7), and
 * three of the findings are the reason this module exists rather than the
 * conversion being four lines in an action.
 *
 * **1. Sending `type` alone is a silent no-op.**
 *    `PUT {transactions:[{transaction_journal_id, type:'transfer'}]}` on a
 *    withdrawal answers **200 OK** with the transaction unchanged — still a
 *    withdrawal. No error, no warning. The accounts have to change too, because
 *    every allowed source/destination pair belongs to exactly one type
 *    (`lib/account-matrix.ts`), so the old pair can never fit the new type.
 *    A caller that trusts the 200 reports success and shows the old type. So
 *    the action VERIFIES the returned type and treats "200, unchanged" as the
 *    failure it is.
 *
 * **2. What survives depends on the pair, not on "the asset side".**
 *    This module used to assume one side was always an asset account and kept
 *    that. Firefly allows thirteen pairs, five of them with a loan, debt or
 *    mortgage where the asset would be, and asset → liability is a WITHDRAWAL,
 *    never a transfer. So the plan now works from the matrix: it keeps the
 *    account you own if the new type has room for it — on whichever side that
 *    is — swaps the two sides outright when the reversed pair fits, and asks
 *    only for what is left. Both sides stay editable in the dialog.
 *
 * **3. Omitting a split from the PUT DELETES it.**
 *    The `transactions` array replaces the group. Converting one split of a
 *    two-split group by sending only that split left the group with one split
 *    and destroyed the other — silently, with a 200. Every split must be sent.
 *    Fields left off a split that IS sent are preserved, so each entry only
 *    needs its journal id, the new type and the accounts.
 *    A group of more than one split also requires `group_title`, or Firefly
 *    422s with "A group title is mandatory when there is more than one
 *    transaction."
 */

import {
  FLOW_LABELS,
  destinationKinds,
  isAllowed,
  isOwn,
  kindFromFirefly,
  sourceKinds,
  type AccountKind,
} from './account-matrix';

export type TransactionType = 'withdrawal' | 'deposit' | 'transfer';

export const CONVERTIBLE_TYPES: TransactionType[] = ['withdrawal', 'deposit', 'transfer'];

export const TYPE_LABELS: Record<TransactionType, string> = {
  withdrawal: 'Expense',
  deposit: 'Income',
  transfer: 'Transfer',
};

/**
 * Where the account you own conventionally sits for a given type: a
 * withdrawal pays out of it, a deposit pays into it. A transfer has one on both
 * sides; 'source' is returned because that is the one a conversion away from a
 * transfer prefers to keep.
 */
export function assetSide(type: TransactionType): 'source' | 'destination' {
  return type === 'deposit' ? 'destination' : 'source';
}

export interface SplitLike {
  transaction_journal_id?: string;
  type: string;
  source_id: string | null;
  source_name: string | null;
  /** Firefly's type title for the source ("Asset account", "Loan"). */
  source_type?: string | null;
  destination_id: string | null;
  destination_name: string | null;
  destination_type?: string | null;
}

export interface SideAccount {
  id: string;
  name: string;
  kind: AccountKind | null;
}

export interface ConversionPlan {
  /** Pre-filled source, or null when the user has to choose one. */
  source: SideAccount | null;
  destination: SideAccount | null;
  /** True when the plan reverses the two existing accounts. */
  swapped: boolean;
}

function side(split: SplitLike, which: 'source' | 'destination'): SideAccount | null {
  const id = which === 'source' ? split.source_id : split.destination_id;
  const name = which === 'source' ? split.source_name : split.destination_name;
  const type = which === 'source' ? split.source_type : split.destination_type;
  if (!id || !name) return null;
  return { id, name, kind: kindFromFirefly(type) };
}

/**
 * Work out a sensible starting point for a conversion, given the transaction
 * as it stands.
 *
 * Returns null when the target is the current type — there is nothing to do,
 * and offering it would produce a PUT that Firefly answers 200 to while
 * changing nothing, which is indistinguishable from the no-op above.
 */
export function planConversion(
  split: SplitLike,
  to: TransactionType,
): ConversionPlan | { error: string } | null {
  const from = split.type.toLowerCase() as TransactionType;
  if (from === to) return null;
  if (!CONVERTIBLE_TYPES.includes(from)) {
    // Opening balances and reconciliations are Firefly's own bookkeeping
    // entries. They have no counter-account a user could name.
    return { error: `A ${split.type} cannot be converted.` };
  }

  const source = side(split, 'source');
  const destination = side(split, 'destination');
  if (!source && !destination) {
    return { error: 'This transaction has no accounts to carry across.' };
  }

  // 1. The reversed pair fits: "it was money IN from the loan, not out to it".
  if (source?.kind && destination?.kind && isAllowed(to, destination.kind, source.kind)) {
    return { source: destination, destination: source, swapped: true };
  }

  // 2. Keep the account you own, wherever the new type has room for it. The
  //    one in the conventional place for the OLD type goes first, so a
  //    transfer keeps its source, as it always has.
  const preferred = assetSide(from);
  const candidates = (preferred === 'source' ? [source, destination] : [destination, source])
    .filter((account): account is SideAccount => account !== null)
    .filter((account) => account.kind === null || isOwn(account.kind));

  for (const account of candidates) {
    const fitsSource = !account.kind || sourceKinds(to).includes(account.kind);
    const fitsDestination = !account.kind || destinationKinds(to).includes(account.kind);
    const first = assetSide(to);
    if (first === 'source' && fitsSource)
      return { source: account, destination: null, swapped: false };
    if (first === 'destination' && fitsDestination) {
      return { source: null, destination: account, swapped: false };
    }
    if (fitsSource) return { source: account, destination: null, swapped: false };
    if (fitsDestination) return { source: null, destination: account, swapped: false };
  }

  return { source: null, destination: null, swapped: false };
}

/** One sentence for the dialog, describing the choices as they currently stand. */
export function describeConversion(
  to: TransactionType,
  sourceName: string,
  destinationName: string,
): string {
  const from = sourceName.trim() || 'the account you choose';
  const into = destinationName.trim() || 'the account you choose';
  return `Money moves from ${from} to ${into}, recorded as a ${FLOW_LABELS[to].toLowerCase()}.`;
}

export interface ChosenAccount {
  id?: string;
  name: string;
}

/**
 * The split payload for `PUT /transactions/{id}`.
 *
 * EVERY split of the group goes in, because omitting one deletes it. Only the
 * converted fields are set; everything else — amount, description, category,
 * budget, tags, notes — is left off and preserved by Firefly.
 *
 * The dialog is built from the FIRST split, but the splits of a group can
 * differ on one side (a withdrawal to two shops shares its source and nothing
 * else). So a side the user left as one of the first split's own accounts is
 * carried per split — same side, or the opposite side if they swapped — and
 * only a side they actually replaced gets the new account on every split.
 */
export function buildConversionPayload(
  splits: SplitLike[],
  to: TransactionType,
  chosen: { source: ChosenAccount; destination: ChosenAccount },
  groupTitle: string | null,
): Record<string, unknown> {
  const first = splits[0];

  function resolve(
    split: SplitLike,
    account: ChosenAccount,
  ): Record<'id' | 'name', string | undefined> {
    if (first && account.id) {
      if (account.id === first.source_id && split.source_id)
        return { id: split.source_id, name: undefined };
      if (account.id === first.destination_id && split.destination_id) {
        return { id: split.destination_id, name: undefined };
      }
    }
    /*
     * By id when the account already exists, by name when it does not —
     * Firefly creates expense and revenue accounts on the fly from a name, the
     * same way the transaction form does, so "converted to an expense paid to
     * a shop I have never recorded" works without a detour to create it first.
     */
    return account.id ? { id: account.id, name: undefined } : { id: undefined, name: account.name };
  }

  const transactions = splits.map((split) => {
    const entry: Record<string, unknown> = {
      transaction_journal_id: split.transaction_journal_id,
      type: to,
    };
    for (const field of ['source', 'destination'] as const) {
      const { id, name } = resolve(split, chosen[field]);
      if (id) entry[`${field}_id`] = id;
      else entry[`${field}_name`] = name;
    }
    return entry;
  });

  return {
    // Mandatory above one split, and harmless at one.
    ...(splits.length > 1 ? { group_title: groupTitle ?? 'Split transaction' } : {}),
    transactions,
  };
}

/**
 * Did it actually convert?
 *
 * Firefly answers 200 whether or not the conversion took, so this is the only
 * thing standing between a bad combination and a success message over an
 * unchanged transaction.
 */
export function conversionApplied(splits: Array<{ type: string }>, to: TransactionType): boolean {
  return splits.length > 0 && splits.every((split) => split.type.toLowerCase() === to);
}
