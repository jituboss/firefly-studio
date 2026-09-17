/**
 * E15-02 — Firefly III search operators.
 *
 * **Every operator here was verified against a live instance**, not taken from
 * documentation, because of one behaviour that makes guessing dangerous: a
 * misspelled operator does not error. Firefly treats an unrecognised
 * `word:value` as literal search text, which matches nothing, so
 * `catagory_is:Food` returns zero results that look exactly like "you have no
 * food spending". The hint bar exists to stop that happening.
 *
 * The other thing the probe established: **a value containing a space must be
 * quoted**. `budget_is:Everyday spending` returns 0; `budget_is:"Everyday
 * spending"` returns 68. Unquoted, the space ends the operator and the rest
 * becomes free text.
 */

export interface SearchOperator {
  name: string;
  /** What it matches, in the user's words. */
  hint: string;
  /** A realistic example, used as the inserted placeholder. */
  example: string;
  group: 'text' | 'money' | 'date' | 'accounts' | 'grouping' | 'flags';
  /** Fixed choices, where the operator only accepts a few. */
  values?: readonly string[];
}

export const SEARCH_OPERATORS: readonly SearchOperator[] = [
  // text
  { name: 'description_contains', hint: 'Description contains', example: 'rent', group: 'text' },
  {
    name: 'description_starts',
    hint: 'Description starts with',
    example: 'Monthly',
    group: 'text',
  },
  { name: 'description_ends', hint: 'Description ends with', example: 'rent', group: 'text' },
  {
    name: 'description_is',
    hint: 'Description is exactly',
    example: 'Monthly rent',
    group: 'text',
  },
  { name: 'notes_contain', hint: 'Notes contain', example: 'refund', group: 'text' },

  // money
  { name: 'amount_is', hint: 'Amount is exactly', example: '15.99', group: 'money' },
  { name: 'amount_more', hint: 'Amount is more than', example: '100', group: 'money' },
  { name: 'amount_less', hint: 'Amount is less than', example: '20', group: 'money' },
  { name: 'currency_is', hint: 'Currency is', example: 'EUR', group: 'money' },

  // date
  { name: 'date_after', hint: 'On or after', example: '2026-01-01', group: 'date' },
  { name: 'date_before', hint: 'On or before', example: '2026-12-31', group: 'date' },
  { name: 'date_is', hint: 'On exactly', example: '2026-09-16', group: 'date' },

  // accounts
  {
    name: 'account_is',
    hint: 'Either account is',
    example: 'Everyday Checking',
    group: 'accounts',
  },
  {
    name: 'account_contains',
    hint: 'Either account contains',
    example: 'Checking',
    group: 'accounts',
  },
  {
    name: 'source_account_is',
    hint: 'Money came from',
    example: 'Everyday Checking',
    group: 'accounts',
  },
  {
    name: 'source_account_contains',
    hint: 'Source contains',
    example: 'Checking',
    group: 'accounts',
  },
  { name: 'destination_account_is', hint: 'Money went to', example: 'Tesco', group: 'accounts' },
  {
    name: 'destination_account_contains',
    hint: 'Destination contains',
    example: 'Tes',
    group: 'accounts',
  },

  // grouping
  { name: 'category_is', hint: 'Category is', example: 'Groceries', group: 'grouping' },
  { name: 'category_contains', hint: 'Category contains', example: 'Groc', group: 'grouping' },
  { name: 'budget_is', hint: 'Budget is', example: 'Everyday spending', group: 'grouping' },
  { name: 'budget_contains', hint: 'Budget contains', example: 'Everyday', group: 'grouping' },
  { name: 'bill_is', hint: 'Subscription is', example: 'Netflix', group: 'grouping' },
  { name: 'tag_is', hint: 'Tagged', example: 'holiday', group: 'grouping' },
  {
    name: 'type',
    hint: 'Transaction type',
    example: 'withdrawal',
    group: 'grouping',
    values: ['withdrawal', 'deposit', 'transfer'],
  },

  // flags
  {
    name: 'has_no_category',
    hint: 'Has no category',
    example: 'true',
    group: 'flags',
    values: ['true'],
  },
  {
    name: 'has_any_category',
    hint: 'Has a category',
    example: 'true',
    group: 'flags',
    values: ['true'],
  },
  {
    name: 'has_no_budget',
    hint: 'Has no budget',
    example: 'true',
    group: 'flags',
    values: ['true'],
  },
  {
    name: 'has_any_budget',
    hint: 'Has a budget',
    example: 'true',
    group: 'flags',
    values: ['true'],
  },
  { name: 'has_no_tag', hint: 'Has no tags', example: 'true', group: 'flags', values: ['true'] },
  { name: 'has_any_tag', hint: 'Has a tag', example: 'true', group: 'flags', values: ['true'] },
] as const;

export const OPERATOR_NAMES: ReadonlySet<string> = new Set(
  SEARCH_OPERATORS.map((entry) => entry.name),
);

export const GROUP_LABELS: Record<SearchOperator['group'], string> = {
  text: 'Description & notes',
  money: 'Amount',
  date: 'Date',
  accounts: 'Accounts',
  grouping: 'Category, budget, tags',
  flags: 'Missing or present',
};

/** Wrap a value in quotes when it contains a space, which Firefly requires. */
export const quoteIfNeeded = (value: string): string =>
  /\s/.test(value) && !/^".*"$/.test(value) ? `"${value}"` : value;

export interface ParsedTerm {
  /** The operator name, or null for a bare free-text word. */
  operator: string | null;
  value: string;
  /** Character offsets in the original string. */
  start: number;
  end: number;
  /** True when it looks like an operator but is not one Firefly knows. */
  unknown: boolean;
}

/**
 * Split a query into terms, honouring quoted values.
 *
 * Used to highlight unknown operators before the search runs — the whole point,
 * given that Firefly answers a typo with a confident, empty result set.
 */
export function parseQuery(query: string): ParsedTerm[] {
  const terms: ParsedTerm[] = [];
  // `name:"quoted value"` or `name:bare` or a bare word.
  const pattern = /(\S+?):("(?:[^"\\]|\\.)*"|\S*)|(\S+)/g;

  for (const match of query.matchAll(pattern)) {
    const [whole, name, rawValue, bare] = match;
    const start = match.index ?? 0;

    if (name !== undefined) {
      const value = (rawValue ?? '').replace(/^"|"$/g, '');
      terms.push({
        operator: name,
        value,
        start,
        end: start + whole.length,
        unknown: !OPERATOR_NAMES.has(name),
      });
    } else if (bare) {
      terms.push({ operator: null, value: bare, start, end: start + whole.length, unknown: false });
    }
  }

  return terms;
}

/** Operators in the query that Firefly will silently ignore. */
export const unknownOperators = (query: string): string[] => [
  ...new Set(
    parseQuery(query)
      .filter((term) => term.unknown && term.operator)
      .map((term) => term.operator as string),
  ),
];

/**
 * Suggestions for the token the caret currently sits in.
 *
 * Returns the operators whose name or hint matches what has been typed so far,
 * plus the span to replace on selection.
 */
export function suggestAt(
  query: string,
  caret: number,
): { matches: SearchOperator[]; start: number; end: number; typed: string } {
  // Walk out to the surrounding whitespace-delimited token.
  let start = caret;
  while (start > 0 && !/\s/.test(query[start - 1]!)) start -= 1;
  let end = caret;
  while (end < query.length && !/\s/.test(query[end]!)) end += 1;

  const token = query.slice(start, end);
  // Once a value is being typed there is nothing useful to suggest.
  if (token.includes(':')) return { matches: [], start, end, typed: token };

  const needle = token.toLowerCase();
  const matches = needle
    ? SEARCH_OPERATORS.filter(
        (entry) => entry.name.includes(needle) || entry.hint.toLowerCase().includes(needle),
      )
    : [...SEARCH_OPERATORS];

  return { matches: matches.slice(0, 8), start, end, typed: token };
}
