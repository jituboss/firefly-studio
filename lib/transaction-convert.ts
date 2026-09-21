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
 *    withdrawal. No error, no warning. The counter-account has to change too,
 *    because each type demands a different kind of account on the far side:
 *
 *      withdrawal  asset      -> expense
 *      deposit     revenue    -> asset
 *      transfer    asset      -> asset
 *
 *    A caller that trusts the 200 reports success and shows the old type. So
 *    the action VERIFIES the returned type and treats "200, unchanged" as the
 *    failure it is.
 *
 * **2. One side is kept, and which one depends on both types.**
 *    The asset account is the real transaction; the other side is a label for
 *    where the money went or came from. Converting keeps the asset account and
 *    replaces the other side — but withdrawal holds its asset in `source` and
 *    deposit holds it in `destination`, so converting between those two moves
 *    the surviving account from one field to the other.
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

export type TransactionType = 'withdrawal' | 'deposit' | 'transfer';

export const CONVERTIBLE_TYPES: TransactionType[] = ['withdrawal', 'deposit', 'transfer'];

/** Which account kind each type requires on each side. */
export const TYPE_SHAPE: Record<
  TransactionType,
  { source: 'asset' | 'revenue' | 'expense'; destination: 'asset' | 'revenue' | 'expense' }
> = {
  withdrawal: { source: 'asset', destination: 'expense' },
  deposit: { source: 'revenue', destination: 'asset' },
  transfer: { source: 'asset', destination: 'asset' },
};

export const TYPE_LABELS: Record<TransactionType, string> = {
  withdrawal: 'Expense',
  deposit: 'Income',
  transfer: 'Transfer',
};

/**
 * Where the asset account sits for a given type.
 *
 * A transfer has one on both sides; 'source' is returned because that is the
 * one a conversion away from transfer keeps by default.
 */
export function assetSide(type: TransactionType): 'source' | 'destination' {
  return type === 'deposit' ? 'destination' : 'source';
}

export interface ConversionPlan {
  /** Which side the user must supply an account for. */
  askFor: 'source' | 'destination';
  /** The kind of account that side must be. */
  askForKind: 'asset' | 'revenue' | 'expense';
  /** Firefly's own name for that account kind, for the autocomplete filter. */
  askForFireflyType: string;
  /** The asset account carried across, and the field it lands in. */
  keep: { side: 'source' | 'destination'; id: string; name: string };
  /** Plain-language description of the effect, shown before confirming. */
  summary: string;
}

export interface SplitLike {
  transaction_journal_id?: string;
  type: string;
  source_id: string | null;
  source_name: string | null;
  destination_id: string | null;
  destination_name: string | null;
}

/**
 * Work out what a conversion needs, given the transaction as it stands.
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

  const keepSide = assetSide(from);
  const keepId = keepSide === 'source' ? split.source_id : split.destination_id;
  const keepName = keepSide === 'source' ? split.source_name : split.destination_name;
  if (!keepId || !keepName) {
    return { error: 'This transaction has no asset account to carry across.' };
  }

  // Where that asset account has to live under the NEW type.
  const landsOn = assetSide(to);
  const askFor: 'source' | 'destination' = landsOn === 'source' ? 'destination' : 'source';
  const askForKind = TYPE_SHAPE[to][askFor];

  return {
    askFor,
    askForKind,
    askForFireflyType: FIREFLY_ACCOUNT_TYPES[askForKind],
    keep: { side: landsOn, id: keepId, name: keepName },
    summary: summarise(from, to, keepName),
  };
}

/**
 * Firefly's `/autocomplete/accounts` filters on its own type names, which are
 * capitalised and spaced exactly like this. `asset` is an account you own,
 * `expense` is who you paid, `revenue` is who paid you.
 */
export const FIREFLY_ACCOUNT_TYPES: Record<'asset' | 'revenue' | 'expense', string> = {
  asset: 'Asset account',
  expense: 'Expense account',
  revenue: 'Revenue account',
};

/** What to call that side in the form, in the app's own words. */
export const SIDE_LABELS: Record<'asset' | 'revenue' | 'expense', { label: string; hint: string }> =
  {
    asset: { label: 'Account', hint: 'One of your own accounts.' },
    expense: { label: 'Paid to', hint: 'Who received the money. A new name creates the payee.' },
    revenue: { label: 'Received from', hint: 'Who paid you. A new name creates the payer.' },
  };

function summarise(from: TransactionType, to: TransactionType, keepName: string): string {
  if (to === 'transfer') {
    return `Money leaves ${keepName} and arrives in another account you own, instead of ${
      from === 'withdrawal' ? 'being spent' : 'coming from outside'
    }.`;
  }
  if (to === 'deposit') {
    return `${keepName} receives the money instead of ${
      from === 'withdrawal' ? 'paying it out' : 'sending it elsewhere'
    }.`;
  }
  return `${keepName} pays the money out instead of ${
    from === 'deposit' ? 'receiving it' : 'sending it to another account you own'
  }.`;
}

/**
 * The split payload for `PUT /transactions/{id}`.
 *
 * EVERY split of the group goes in, because omitting one deletes it. Only the
 * converted fields are set; everything else — amount, description, category,
 * budget, tags, notes — is left off and preserved by Firefly.
 */
export function buildConversionPayload(
  splits: SplitLike[],
  plan: ConversionPlan,
  to: TransactionType,
  counterAccount: { id?: string; name: string },
  groupTitle: string | null,
): Record<string, unknown> {
  const counterField = plan.askFor;
  const keepField = plan.keep.side;

  const transactions = splits.map((split) => {
    const entry: Record<string, unknown> = {
      transaction_journal_id: split.transaction_journal_id,
      type: to,
    };
    entry[`${keepField}_id`] = plan.keep.id;
    /*
     * By id when the account already exists, by name when it does not —
     * Firefly creates expense and revenue accounts on the fly from a name, the
     * same way the transaction form does, so "converted to an expense paid to
     * a shop I have never recorded" works without a detour to create it first.
     */
    if (counterAccount.id) entry[`${counterField}_id`] = counterAccount.id;
    else entry[`${counterField}_name`] = counterAccount.name;
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
