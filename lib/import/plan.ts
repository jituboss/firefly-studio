import {
  FLOW_LABELS,
  KIND_LABELS,
  pairProblem,
  typeFor,
  type AccountKind,
  type FlowType,
} from '@/lib/account-matrix';
import { canonicalAmount, type ImportRow } from './cells';
import { inferKinds, type KindGuess } from './infer';
import { isSampleRow } from './sample';

/**
 * Turning parsed rows into a plan: which account each side is, what has to be
 * created, which type each row is, and which rows are already in the ledger.
 *
 * Pure, so the preview and the commit compute exactly the same thing, and so
 * every rule below is pinned by a unit test rather than by a round trip.
 *
 * **Accounts.** A name matches an existing account case- and space-
 * insensitively. Firefly keeps names unique per TYPE only, so one name can be
 * an asset and an expense at once; the pair table settles which pair is meant.
 * A name that matches nothing becomes a new account, and the kind it gets is
 * the conservative one: a new payee is an expense, a new payer is revenue, and
 * nothing else is ever invented. A new asset or liability account is created
 * only when the file (or the preview) says so in its kind column, because a
 * typo that silently opens a bank account does more damage than one that
 * opens a payee.
 *
 * **Duplicates.** The fingerprint is date + amount + source + destination,
 * with accounts by id once resolved. It is checked against the LEDGER, not
 * against a record of past imports: that catches what was typed in by hand,
 * and a transaction deleted in Firefly is importable again rather than blocked
 * by a stale list. Identical rows are counted, not collapsed — two coffees of
 * the same price on the same day are both real — so with two in the file and
 * one in the ledger, one is imported and one is flagged.
 */

export interface ExistingAccount {
  id: string;
  name: string;
  kind: AccountKind;
  active: boolean;
  currency: string | null;
}

export interface RowOverride {
  skip?: boolean;
  /** Import even though it matches the ledger. */
  force?: boolean;
  swap?: boolean;
}

export interface AccountOverride {
  /** Create the new account as this kind. */
  kind?: AccountKind;
  /** Use this existing account instead of creating one. */
  mapTo?: { id: string; name: string; kind: AccountKind };
}

export interface ImportOverrides {
  rows: Record<string, RowOverride>;
  /** Keyed by `normaliseName(name)`. */
  accounts: Record<string, AccountOverride>;
}

export const NO_OVERRIDES: ImportOverrides = { rows: {}, accounts: {} };

export type RowStatus = 'ready' | 'duplicate' | 'error' | 'skipped';

export interface PlannedSide {
  name: string;
  kind: AccountKind | null;
  /** Existing account id, or null when the account will be created. */
  id: string | null;
  /** Key into `newAccounts` when the account will be created. */
  newKey: string | null;
}

export interface PlannedRow {
  line: number;
  row: ImportRow;
  status: RowStatus;
  type: FlowType | null;
  source: PlannedSide | null;
  destination: PlannedSide | null;
  fingerprint: string | null;
  errors: string[];
  warnings: string[];
  /** Swapping the two sides would make the row valid. */
  canSwap: boolean;
  swapped: boolean;
  /** Names as they will be written: an existing one's own spelling where it matched. */
  category: string | null;
  budget: string | null;
  tags: string[];
}

export interface NewAccount {
  key: string;
  name: string;
  kind: AccountKind;
  lines: number[];
  /** Currency of the first row using it, for a new asset or liability. */
  currency: string | null;
  /** An existing account with a near-identical name — probably what was meant. */
  suggestion: ExistingAccount | null;
  /** Why it got this kind: the user's choice, the file, or the inference's reasoning. */
  reason: string;
  /** How sure the inference was; null when the kind was stated rather than guessed. */
  confidence: KindGuess['confidence'] | null;
  /**
   * A row that will import uses it, so the import will create it. False for an
   * account only rows needing attention use — listed so its kind can be set,
   * which is usually the very fix those rows need.
   */
  needed: boolean;
}

/** One category, budget or tag the ready rows use: new, or matched to the ledger's. */
export interface SetupName {
  name: string;
  isNew: boolean;
  rows: number;
}

export interface ImportPlan {
  rows: PlannedRow[];
  newAccounts: NewAccount[];
  /** What the ready rows use, so the preview can say what an import sets up. */
  setup: { categories: SetupName[]; budgets: SetupName[]; tags: SetupName[] };
  counts: Record<RowStatus, number>;
}

export interface LedgerLists {
  categories: string[];
  budgets: string[];
  tags: string[];
}

/** Kinds the import may create. The cash account is Firefly's own, never made by hand. */
export const CREATABLE_KINDS: AccountKind[] = [
  'asset',
  'loan',
  'debt',
  'mortgage',
  'expense',
  'revenue',
];

export function normaliseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Letters and digits only, for spotting "Amazon.com" vs "amazon com". */
function squash(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]!;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j]!;
      previous[j] = Math.min(
        above + 1,
        previous[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length]!;
}

/** The existing account a new name was probably meant to be, if any. */
export function suggestAccount(
  name: string,
  kind: AccountKind,
  accounts: ExistingAccount[],
): ExistingAccount | null {
  const target = squash(name);
  if (!target) return null;
  let best: { account: ExistingAccount; score: number } | null = null;
  for (const account of accounts) {
    const candidate = squash(account.name);
    let score: number | null = null;
    if (candidate === target) score = 0;
    else if (target.length >= 5 && distance(candidate, target) <= 2) score = 1;
    if (score === null) continue;
    // Same kind first: "Amazon" the payee, not "Amazon" the store card.
    if (account.kind !== kind) score += 2;
    if (!best || score < best.score) best = { account, score };
  }
  return best?.account ?? null;
}

/** Fingerprint key for one split. Accounts are ids, or `new:<kind>:<name>` before creation. */
export function fingerprintKey(
  date: string,
  amount: string,
  sourceRef: string,
  destinationRef: string,
): string {
  return `${date}|${canonicalAmount(amount)}|${sourceRef}|${destinationRef}`;
}

function sideRef(side: PlannedSide): string {
  return side.id ?? `new:${side.kind}:${normaliseName(side.name)}`;
}

type Candidate = PlannedSide & { active: boolean };

export function planImport(input: {
  rows: ImportRow[];
  accounts: ExistingAccount[];
  /** Fingerprint key → number of matching splits already in the ledger. */
  ledger: Record<string, number>;
  /** Enabled currency codes; empty skips the check. */
  currencies: string[];
  /** Existing categories, budgets and tags, so a name reuses one rather than doubling it. */
  lists?: LedgerLists;
  overrides?: ImportOverrides;
}): ImportPlan {
  const overrides = input.overrides ?? NO_OVERRIDES;
  const byName = new Map<string, ExistingAccount[]>();
  for (const account of input.accounts) {
    const key = normaliseName(account.name);
    byName.set(key, [...(byName.get(key) ?? []), account]);
  }
  const currencies = new Set(input.currencies);
  /*
   * Firefly matches a category or tag name exactly and creates a new one on
   * any difference, so "groceries" in a file beside an existing "Groceries"
   * would split one category in two. Every name is resolved to the ledger's
   * own spelling first; a genuinely new one keeps the file's first spelling.
   */
  const spelling = (names: string[] = []) =>
    new Map(names.map((name) => [normaliseName(name), name] as const));
  const known = {
    categories: spelling(input.lists?.categories),
    budgets: spelling(input.lists?.budgets),
    tags: spelling(input.lists?.tags),
  };
  const firstSeen = {
    categories: new Map<string, string>(),
    budgets: new Map<string, string>(),
    tags: new Map<string, string>(),
  };
  const canonical = (list: keyof typeof known, name: string): string => {
    const key = normaliseName(name);
    const existing = known[list].get(key);
    if (existing) return existing;
    if (!firstSeen[list].has(key)) firstSeen[list].set(key, name.trim());
    return firstSeen[list].get(key)!;
  };
  const newAccounts = new Map<string, NewAccount>();
  const seen = new Map<string, number[]>();

  const live = (row: ImportRow) => {
    const override = overrides.rows[String(row.line)];
    if (override?.skip) return false;
    return !(isSampleRow(row.notes) && override?.skip !== false);
  };
  const guesses = inferKinds(
    input.rows.filter(live),
    (name) => {
      const key = normaliseName(name);
      return byName.has(key) || Boolean(overrides.accounts[key]?.mapTo);
    },
    (name) => {
      const key = normaliseName(name);
      return overrides.accounts[key]?.mapTo?.kind ?? byName.get(key)?.[0]?.kind ?? null;
    },
  );

  function existing(name: string, kindHint: AccountKind | null): Candidate[] {
    const override = overrides.accounts[normaliseName(name)];
    if (override?.mapTo) {
      return [{ ...override.mapTo, newKey: null, active: true }];
    }
    const kind = override?.kind ?? kindHint;
    return (byName.get(normaliseName(name)) ?? [])
      .filter((account) => !kind || account.kind === kind)
      .map((account) => ({
        name: account.name,
        kind: account.kind,
        id: account.id,
        newKey: null,
        active: account.active,
      }));
  }

  /** The kind a brand-new account on this side gets, or null if it cannot be guessed. */
  /**
   * The kind a brand-new account gets, and why. Precedence: the user's choice
   * in the preview, then a kind column in the file, then the inference
   * (`./infer`), then the plain default — a new payer is revenue, a new payee
   * an expense.
   */
  function newKind(
    name: string,
    hint: AccountKind | null,
    side: 'source' | 'destination',
  ): { kind: AccountKind; reason: string; confidence: KindGuess['confidence'] | null } {
    const chosen = overrides.accounts[normaliseName(name)]?.kind;
    if (chosen) return { kind: chosen, reason: 'You chose this kind.', confidence: null };
    if (hint) return { kind: hint, reason: 'The file says so.', confidence: null };
    const guess = guesses.get(normaliseName(name));
    if (guess) {
      return {
        kind: side === 'source' ? (guess.asSource ?? guess.kind) : guess.kind,
        reason: guess.reason,
        confidence: guess.confidence,
      };
    }
    return side === 'source'
      ? {
          kind: 'revenue',
          reason: 'A new name paying money in is taken for a payer.',
          confidence: 'low',
        }
      : {
          kind: 'expense',
          reason: 'A new name receiving money is taken for a payee.',
          confidence: 'low',
        };
  }
  const why = new Map<string, { reason: string; confidence: KindGuess['confidence'] | null }>();

  const rows = input.rows.map((row): PlannedRow => {
    const rowOverride = overrides.rows[String(row.line)] ?? {};
    const swapped = Boolean(rowOverride.swap);
    const errors = [...row.problems];
    const warnings = [...row.notices];

    const sourceName = swapped ? row.destination : row.source;
    const destinationName = swapped ? row.source : row.destination;
    const sourceHint = swapped ? row.destinationKind : row.sourceKind;
    const destinationHint = swapped ? row.sourceKind : row.destinationKind;

    const base: PlannedRow = {
      line: row.line,
      row,
      category: row.category ? canonical('categories', row.category) : null,
      budget: null,
      tags: [...new Set(row.tags.map((tag) => canonical('tags', tag)))],
      status: 'error',
      type: null,
      source: null,
      destination: null,
      fingerprint: null,
      errors,
      warnings,
      canSwap: false,
      swapped,
    };

    if (rowOverride.skip) return { ...base, status: 'skipped', errors: [] };
    if (isSampleRow(row.notes) && rowOverride.skip !== false) {
      return {
        ...base,
        status: 'skipped',
        errors: [],
        warnings: ['Sample row from the template — skipped. Include it to import it anyway.'],
      };
    }
    if (!sourceName || !destinationName) return base;

    const sources: Candidate[] = existing(sourceName, sourceHint);
    const destinations: Candidate[] = existing(destinationName, destinationHint);

    const resolve = (): { source: Candidate; destination: Candidate } | string => {
      // Both exist: pick the pair the table allows, preferring the stated type.
      if (sources.length > 0 && destinations.length > 0) {
        const pairs = sources.flatMap((source) =>
          destinations.map((destination) => ({ source, destination })),
        );
        const valid = pairs.filter(
          (pair) =>
            pair.source.kind &&
            pair.destination.kind &&
            typeFor(pair.source.kind, pair.destination.kind) !== null &&
            (!row.type || typeFor(pair.source.kind, pair.destination.kind) === row.type),
        );
        return valid[0] ?? pairs[0]!;
      }

      // One side exists. The other is new, and its kind follows from the side
      // that exists — preferring a pair that fits the stated type.
      const make = (
        name: string,
        decided: { kind: AccountKind; reason: string; confidence: KindGuess['confidence'] | null },
      ): Candidate => {
        const newKey = `${decided.kind}:${normaliseName(name)}`;
        if (!why.has(newKey)) why.set(newKey, decided);
        return { name, kind: decided.kind, id: null, newKey, active: true };
      };

      // One side exists. The new side's kind comes from `newKind`, and the
      // existing side is the same-named account that pairs with it, if several.
      if (sources.length > 0) {
        const decided = newKind(destinationName, destinationHint, 'destination');
        const source =
          sources.find(
            (s) =>
              s.kind &&
              typeFor(s.kind, decided.kind) !== null &&
              (!row.type || typeFor(s.kind, decided.kind) === row.type),
          ) ?? sources[0]!;
        return { source, destination: make(destinationName, decided) };
      }
      if (destinations.length > 0) {
        const decided = newKind(sourceName, sourceHint, 'source');
        const destination =
          destinations.find(
            (d) =>
              d.kind &&
              typeFor(decided.kind, d.kind) !== null &&
              (!row.type || typeFor(decided.kind, d.kind) === row.type),
          ) ?? destinations[0]!;
        return { source: make(sourceName, decided), destination };
      }

      // Neither exists: both kinds from `newKind`, which is where the
      // inference earns its keep — "Acme Ltd → Savings Pot" in a file where
      // Savings Pot also pays out is income into an account of yours. When
      // nothing says either is yours, the payer/payee defaults cannot pair, and
      // the row asks for a kind with both names listed in the preview.
      return {
        source: make(sourceName, newKind(sourceName, sourceHint, 'source')),
        destination: make(
          destinationName,
          newKind(destinationName, destinationHint, 'destination'),
        ),
      };
    };

    const resolved = resolve();
    if (typeof resolved === 'string') {
      errors.push(resolved);
      return base;
    }
    const { source, destination } = resolved;

    for (const side of [source, destination]) {
      if (side.newKey && side.kind && !CREATABLE_KINDS.includes(side.kind)) {
        errors.push(
          `${side.name} would have to be created as ${KIND_LABELS[side.kind].toLowerCase()}, which cannot be created by an import.`,
        );
      }
      if (!side.active) warnings.push(`${side.name} is archived.`);
    }

    let type: FlowType | null = null;
    let canSwap = false;
    if (source.kind && destination.kind) {
      type = typeFor(source.kind, destination.kind);
      if (!type) {
        const problem = pairProblem(row.type ?? 'withdrawal', source.kind, destination.kind);
        errors.push(problem?.message ?? 'These two accounts cannot be paired.');
        canSwap = typeFor(destination.kind, source.kind) !== null;
        for (const side of [source, destination]) {
          if (side.newKey && !overrides.accounts[normaliseName(side.name)]?.kind) {
            errors.push(
              `${side.name} is new and was taken for ${side.kind === 'expense' ? 'a payee' : 'a payer'}. If it is one of your accounts, choose its kind under New accounts.`,
            );
          }
        }
      } else if (row.type && row.type !== type) {
        errors.push(
          `Type says ${FLOW_LABELS[row.type].toLowerCase()}, but ${source.name} → ${destination.name} is a ${FLOW_LABELS[type].toLowerCase()}.`,
        );
        canSwap = typeFor(destination.kind, source.kind) === row.type;
      }
    }

    if (row.currency && currencies.size > 0 && !currencies.has(row.currency)) {
      errors.push(`Currency ${row.currency} is not enabled in Firefly.`);
    }
    if (row.foreignCurrency && currencies.size > 0 && !currencies.has(row.foreignCurrency)) {
      errors.push(`Foreign currency ${row.foreignCurrency} is not enabled in Firefly.`);
    }
    const budget = row.budget && type === 'withdrawal' ? canonical('budgets', row.budget) : null;
    if (row.budget && type && type !== 'withdrawal') {
      warnings.push('Budget ignored: only withdrawals have one.');
    }

    const plannedSource: PlannedSide = {
      name: source.name,
      kind: source.kind,
      id: source.id,
      newKey: source.newKey,
    };
    const plannedDestination: PlannedSide = {
      name: destination.name,
      kind: destination.kind,
      id: destination.id,
      newKey: destination.newKey,
    };

    for (const side of [plannedSource, plannedDestination]) {
      if (!side.newKey || !side.kind) continue;
      const entry = newAccounts.get(side.newKey);
      if (entry) entry.lines.push(row.line);
      else {
        newAccounts.set(side.newKey, {
          key: side.newKey,
          name: side.name,
          kind: side.kind,
          lines: [row.line],
          currency: row.currency,
          needed: false,
          reason: why.get(side.newKey)?.reason ?? '',
          confidence: why.get(side.newKey)?.confidence ?? null,
          suggestion: overrides.accounts[normaliseName(side.name)]
            ? null
            : suggestAccount(side.name, side.kind, input.accounts),
        });
      }
    }

    const fingerprint =
      row.date && row.amount
        ? fingerprintKey(row.date, row.amount, sideRef(plannedSource), sideRef(plannedDestination))
        : null;

    let status: RowStatus = errors.length > 0 ? 'error' : 'ready';
    if (status === 'ready' && fingerprint) {
      const earlier = seen.get(fingerprint) ?? [];
      if (earlier.length > 0) {
        warnings.push(`Same date, amount and accounts as row ${earlier.join(', ')}.`);
      }
      seen.set(fingerprint, [...earlier, row.line]);
      const occurrence = earlier.length + 1;
      if (occurrence <= (input.ledger[fingerprint] ?? 0) && !rowOverride.force) {
        status = 'duplicate';
      }
    }

    return {
      ...base,
      status,
      type,
      source: plannedSource,
      destination: plannedDestination,
      fingerprint,
      errors,
      warnings,
      canSwap,
      budget,
    };
  });

  const counts: Record<RowStatus, number> = { ready: 0, duplicate: 0, error: 0, skipped: 0 };
  for (const row of rows) counts[row.status] += 1;

  const keysOf = (status: RowStatus) =>
    new Set(
      rows
        .filter((row) => row.status === status)
        .flatMap((row) => [row.source?.newKey, row.destination?.newKey])
        .filter((key): key is string => Boolean(key)),
    );
  const ready = keysOf('ready');
  const broken = keysOf('error');

  const readyRows = rows.filter((row) => row.status === 'ready');
  const tally = (list: keyof typeof known, names: (row: PlannedRow) => Array<string | null>) => {
    const counts = new Map<string, number>();
    for (const row of readyRows) {
      for (const name of names(row)) if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts]
      .map(([name, count]) => ({ name, isNew: !known[list].has(normaliseName(name)), rows: count }))
      .sort(
        (a, b) =>
          Number(b.isNew) - Number(a.isNew) || b.rows - a.rows || a.name.localeCompare(b.name),
      );
  };

  return {
    rows,
    setup: {
      categories: tally('categories', (row) => [row.category]),
      budgets: tally('budgets', (row) => [row.budget]),
      tags: tally('tags', (row) => row.tags),
    },
    newAccounts: [...newAccounts.values()]
      .filter((account) => ready.has(account.key) || broken.has(account.key))
      .map((account) => ({ ...account, needed: ready.has(account.key) })),
    counts,
  };
}
