/**
 * Which kinds of account a transaction may move money between, and which type
 * of transaction that movement is.
 *
 * This is Firefly's own `config('firefly.source_dests')`, transcribed from
 * `config/firefly.php` in the 6.7.9 container rather than from the OpenAPI
 * spec, which does not describe it at all. Firefly enforces it on every write,
 * so a form that offers anything outside it offers a 422 — and a form that
 * offers LESS than it hides accounts the user can legitimately pick.
 *
 * The app did the second for a long time. It knew three pairs (asset→expense,
 * revenue→asset, asset→asset) where Firefly allows thirteen, so a withdrawal
 * paid from a loan could not even be edited: the "From" picker searched asset
 * accounts only and the loan was not there to find.
 *
 * Two things in this table defeat the obvious assumption:
 *
 *  - **Asset ↔ liability is never a transfer.** Paying a loan from a current
 *    account is a WITHDRAWAL (asset → loan); a loan paid out into one is a
 *    DEPOSIT (loan → asset). A transfer is asset → asset or liability →
 *    liability, nothing else. "Transfer to my mortgage" is the single most
 *    common way to be refused.
 *  - **Every allowed pair belongs to exactly one type.** So the type is a pure
 *    function of the two accounts (`typeFor`), which is what lets the form say
 *    "that combination is a withdrawal" and lets an import infer the type of a
 *    row from its accounts alone.
 *
 * Opening balances, reconciliations and liability credits are left out: they
 * use system accounts nobody picks by hand.
 */

export type AccountKind = 'asset' | 'expense' | 'revenue' | 'cash' | 'loan' | 'debt' | 'mortgage';
export type FlowType = 'withdrawal' | 'deposit' | 'transfer';

export const FLOW_TYPES: FlowType[] = ['withdrawal', 'deposit', 'transfer'];
export const ALL_KINDS: AccountKind[] = [
  'asset',
  'loan',
  'debt',
  'mortgage',
  'expense',
  'revenue',
  'cash',
];
export const LIABILITY_KINDS: AccountKind[] = ['loan', 'debt', 'mortgage'];
/** Accounts the user owns, as opposed to the payees and payers around them. */
export const OWN_KINDS: AccountKind[] = ['asset', ...LIABILITY_KINDS];

const L = LIABILITY_KINDS;

/** type → source kind → allowed destination kinds. Verbatim from Firefly. */
export const SOURCE_DESTS: Record<FlowType, Partial<Record<AccountKind, AccountKind[]>>> = {
  withdrawal: {
    asset: ['expense', ...L, 'cash'],
    loan: ['expense', 'cash'],
    debt: ['expense', 'cash'],
    mortgage: ['expense', 'cash'],
  },
  deposit: {
    revenue: ['asset', ...L],
    cash: ['asset', ...L],
    loan: ['asset'],
    debt: ['asset'],
    mortgage: ['asset'],
  },
  transfer: {
    asset: ['asset'],
    loan: [...L],
    debt: [...L],
    mortgage: [...L],
  },
};

/**
 * Firefly's account type titles, as `/autocomplete/accounts?types=` takes them
 * and as `source_type` / the autocomplete's `type` report them.
 */
export const FIREFLY_TYPE_TITLES: Record<AccountKind, string> = {
  asset: 'Asset account',
  expense: 'Expense account',
  revenue: 'Revenue account',
  cash: 'Cash account',
  loan: 'Loan',
  debt: 'Debt',
  mortgage: 'Mortgage',
};

export const KIND_LABELS: Record<AccountKind, string> = {
  asset: 'Asset',
  expense: 'Expense',
  revenue: 'Revenue',
  cash: 'Cash',
  loan: 'Loan',
  debt: 'Debt',
  mortgage: 'Mortgage',
};

export const FLOW_LABELS: Record<FlowType, string> = {
  withdrawal: 'Withdrawal',
  deposit: 'Deposit',
  transfer: 'Transfer',
};

export function isLiability(kind: AccountKind | null | undefined): boolean {
  return kind === 'loan' || kind === 'debt' || kind === 'mortgage';
}

export function isOwn(kind: AccountKind | null | undefined): boolean {
  return kind === 'asset' || isLiability(kind);
}

/**
 * Read a kind out of anything Firefly calls an account type: a split's
 * `source_type` ("Asset account", "Loan"), an autocomplete row's `type`, the
 * account resource's lower-case `type` ("asset", "liabilities") — which needs
 * its `liability_type` to say which liability — or a word typed into an
 * import file. Returns null for system accounts and anything unrecognised.
 */
export function kindFromFirefly(
  type: string | null | undefined,
  liabilityType?: string | null,
): AccountKind | null {
  if (!type) return null;
  const value = type.trim().toLowerCase();
  if (value === 'liabilities' || value === 'liability') {
    const sub = liabilityType?.trim().toLowerCase();
    return sub === 'loan' || sub === 'debt' || sub === 'mortgage' ? sub : null;
  }
  switch (value) {
    case 'asset':
    case 'asset account':
    case 'default account':
      return 'asset';
    case 'expense':
    case 'expense account':
    case 'beneficiary account':
      return 'expense';
    case 'revenue':
    case 'revenue account':
      return 'revenue';
    case 'cash':
    case 'cash account':
      return 'cash';
    case 'loan':
    case 'debt':
    case 'mortgage':
      return value;
    default:
      return null;
  }
}

/** The transaction type for a source/destination pair, or null if Firefly forbids it. */
export function typeFor(source: AccountKind, destination: AccountKind): FlowType | null {
  for (const type of FLOW_TYPES) {
    if (SOURCE_DESTS[type][source]?.includes(destination)) return type;
  }
  return null;
}

export function isAllowed(type: FlowType, source: AccountKind, destination: AccountKind): boolean {
  return SOURCE_DESTS[type][source]?.includes(destination) ?? false;
}

/**
 * Kinds that may be the source of `type`, narrowed to those that pair with
 * `destination` when it is already known.
 */
export function sourceKinds(type: FlowType, destination?: AccountKind | null): AccountKind[] {
  const table = SOURCE_DESTS[type];
  return ALL_KINDS.filter((kind) => {
    const targets = table[kind];
    if (!targets) return false;
    return destination ? targets.includes(destination) : true;
  });
}

/** Kinds that may receive `type`, narrowed to those `source` can reach when known. */
export function destinationKinds(type: FlowType, source?: AccountKind | null): AccountKind[] {
  const table = SOURCE_DESTS[type];
  const reachable = new Set<AccountKind>();
  for (const kind of ALL_KINDS) {
    if (source && kind !== source) continue;
    for (const target of table[kind] ?? []) reachable.add(target);
  }
  return ALL_KINDS.filter((kind) => reachable.has(kind));
}

/**
 * The `types` value for `/autocomplete/accounts`. Comma-separated with NO
 * spaces: Firefly splits on a bare comma and then validates each part against
 * its list, so "Asset account, Loan" is refused for the leading space.
 */
export function autocompleteTypes(kinds: AccountKind[]): string {
  return kinds.map((kind) => FIREFLY_TYPE_TITLES[kind]).join(',');
}

/**
 * Firefly creates expense and revenue accounts from a bare name on a
 * transaction write. Everything else — your own accounts, the cash account —
 * has to exist already, so a picker limited to those must not accept free text.
 */
export function acceptsNewName(kinds: AccountKind[]): boolean {
  return kinds.includes('expense') || kinds.includes('revenue');
}

/**
 * Explain a pair that does not fit `type`, in the user's terms. Returns null
 * when the pair is fine. When the pair is valid for ANOTHER type the result
 * names it, so the form can offer to switch rather than just refuse.
 */
export function pairProblem(
  type: FlowType,
  source: AccountKind,
  destination: AccountKind,
): { message: string; suggest: FlowType | null } | null {
  if (isAllowed(type, source, destination)) return null;
  const suggest = typeFor(source, destination);
  const pair = `${KIND_LABELS[source].toLowerCase()} → ${KIND_LABELS[destination].toLowerCase()}`;
  if (suggest) {
    return {
      message: `Firefly records ${pair} as a ${FLOW_LABELS[suggest].toLowerCase()}, not a ${FLOW_LABELS[type].toLowerCase()}.${explainer(source, destination)}`,
      suggest,
    };
  }
  const swapped = typeFor(destination, source);
  return {
    message: `Money cannot move ${pair}.${
      swapped
        ? ` The other way round it would be a ${FLOW_LABELS[swapped].toLowerCase()} — are the two sides swapped?`
        : ''
    }`,
    suggest: null,
  };
}

function explainer(source: AccountKind, destination: AccountKind): string {
  if (source === 'asset' && isLiability(destination)) {
    return ' Paying off a liability from your own account is money leaving that account.';
  }
  if (isLiability(source) && destination === 'asset') {
    return ' Money borrowed into your own account arrives as a deposit.';
  }
  return '';
}
