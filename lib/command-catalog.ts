/**
 * The command palette's catalogue: every page, create action, report and
 * setting it can jump to, and the matcher that filters and ranks them as the
 * user types.
 *
 * It used to be five hard-coded links that ignored the search box entirely —
 * typing "budg" changed nothing, because cmdk's own filtering is switched off
 * (the transaction search is server-side) and nothing replaced it. The
 * matching lives here, pure, so it can be tested without a DOM.
 */

export type CommandGroup = 'Pages' | 'Create' | 'Reports' | 'Settings';

export interface CommandEntry {
  id: string;
  label: string;
  href: string;
  group: CommandGroup;
  /** Other words someone might type for it. Matched, never highlighted. */
  keywords?: string;
  /** Shown only to administrators. */
  admin?: boolean;
}

export const COMMANDS: readonly CommandEntry[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    group: 'Pages',
    keywords: 'home overview',
  },
  {
    id: 'accounts',
    label: 'Accounts',
    href: '/accounts',
    group: 'Pages',
    keywords: 'bank balance',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    href: '/transactions',
    group: 'Pages',
    keywords: 'ledger history spending',
  },
  {
    id: 'budgets',
    label: 'Budgets',
    href: '/budgets',
    group: 'Pages',
    keywords: 'limits envelope',
  },
  {
    id: 'available-budgets',
    label: 'Available budgets',
    href: '/available-budgets',
    group: 'Pages',
  },
  {
    id: 'without-budget',
    label: 'Spending without a budget',
    href: '/budgets/transactions-without-budget',
    group: 'Pages',
  },
  { id: 'categories', label: 'Categories', href: '/categories', group: 'Pages' },
  {
    id: 'uncategorised',
    label: 'Uncategorised transactions',
    href: '/categories/uncategorised',
    group: 'Pages',
    keywords: 'inbox',
  },
  {
    id: 'bills',
    label: 'Subscriptions',
    href: '/bills',
    group: 'Pages',
    keywords: 'bills recurring payments',
  },
  {
    id: 'bills-calendar',
    label: 'Subscription calendar',
    href: '/bills/calendar',
    group: 'Pages',
    keywords: 'bills due',
  },
  {
    id: 'piggy-banks',
    label: 'Piggy banks',
    href: '/piggy-banks',
    group: 'Pages',
    keywords: 'savings goals',
  },
  {
    id: 'attachments',
    label: 'Attachments',
    href: '/attachments',
    group: 'Pages',
    keywords: 'receipts files',
  },
  {
    id: 'recurring',
    label: 'Recurring transactions',
    href: '/recurring',
    group: 'Pages',
    keywords: 'repeat schedule',
  },
  { id: 'rules', label: 'Rules', href: '/rules', group: 'Pages', keywords: 'automation' },
  { id: 'tags', label: 'Tags', href: '/tags', group: 'Pages' },
  { id: 'currencies', label: 'Currencies', href: '/currencies', group: 'Pages', keywords: 'money' },
  {
    id: 'exchange-rates',
    label: 'Exchange rates',
    href: '/currencies/rates',
    group: 'Pages',
    keywords: 'fx currency',
  },
  {
    id: 'admin',
    label: 'Admin',
    href: '/admin',
    group: 'Pages',
    keywords: 'users administrator',
    admin: true,
  },

  {
    id: 'new-transaction',
    label: 'New transaction',
    href: '/transactions/new',
    group: 'Create',
    keywords: 'add expense income transfer',
  },
  {
    id: 'new-account',
    label: 'New account',
    href: '/accounts/new',
    group: 'Create',
    keywords: 'add',
  },
  { id: 'new-budget', label: 'New budget', href: '/budgets/new', group: 'Create', keywords: 'add' },
  {
    id: 'new-category',
    label: 'New category',
    href: '/categories/new',
    group: 'Create',
    keywords: 'add',
  },
  {
    id: 'new-bill',
    label: 'New subscription',
    href: '/bills/new',
    group: 'Create',
    keywords: 'add bill',
  },
  {
    id: 'new-piggy',
    label: 'New piggy bank',
    href: '/piggy-banks/new',
    group: 'Create',
    keywords: 'add savings goal',
  },
  {
    id: 'new-recurring',
    label: 'New recurring transaction',
    href: '/recurring/new',
    group: 'Create',
    keywords: 'add repeat',
  },
  {
    id: 'new-rule',
    label: 'New rule',
    href: '/rules/new',
    group: 'Create',
    keywords: 'add automation',
  },
  {
    id: 'new-rule-group',
    label: 'New rule group',
    href: '/rules/groups/new',
    group: 'Create',
    keywords: 'add',
  },
  { id: 'new-tag', label: 'New tag', href: '/tags/new', group: 'Create', keywords: 'add' },
  {
    id: 'new-currency',
    label: 'New currency',
    href: '/currencies/new',
    group: 'Create',
    keywords: 'add',
  },

  { id: 'reports', label: 'Reports overview', href: '/reports', group: 'Reports' },
  {
    id: 'report-net-worth',
    label: 'Net worth report',
    href: '/reports/net-worth',
    group: 'Reports',
  },
  {
    id: 'report-income-expense',
    label: 'Income vs expense report',
    href: '/reports/income-expense',
    group: 'Reports',
  },
  {
    id: 'report-categories',
    label: 'Category report',
    href: '/reports/categories',
    group: 'Reports',
  },
  { id: 'report-budgets', label: 'Budget report', href: '/reports/budgets', group: 'Reports' },
  { id: 'report-accounts', label: 'Account report', href: '/reports/accounts', group: 'Reports' },
  { id: 'report-tags', label: 'Tag report', href: '/reports/tags', group: 'Reports' },
  {
    id: 'report-bills',
    label: 'Subscription report',
    href: '/reports/bills',
    group: 'Reports',
    keywords: 'bills',
  },
  {
    id: 'report-cash-flow',
    label: 'Cash flow',
    href: '/reports/cash-flow',
    group: 'Reports',
    keywords: 'sankey',
  },
  {
    id: 'report-custom',
    label: 'Custom report builder',
    href: '/reports/custom',
    group: 'Reports',
  },

  {
    id: 'settings-connections',
    label: 'Connections',
    href: '/settings/connections',
    group: 'Settings',
    keywords: 'firefly instance token',
  },
  {
    id: 'settings-preferences',
    label: 'Preferences',
    href: '/settings/preferences',
    group: 'Settings',
    keywords: 'theme landing locale',
  },
  {
    id: 'settings-firefly',
    label: 'Firefly instance settings',
    href: '/settings/firefly',
    group: 'Settings',
  },
  {
    id: 'settings-security',
    label: 'Security',
    href: '/settings/security',
    group: 'Settings',
    keywords: 'password two-factor mfa sessions',
  },
  {
    id: 'settings-danger',
    label: 'Danger zone',
    href: '/settings/danger',
    group: 'Settings',
    keywords: 'delete purge',
  },
];

export const COMMAND_GROUPS: readonly CommandGroup[] = ['Pages', 'Create', 'Reports', 'Settings'];

/** A `[start, end)` character range of a label to highlight. */
export type Range = readonly [number, number];

export interface Match {
  score: number;
  ranges: Range[];
}

function tokens(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * Does `label` (plus `keywords`) match every word of `query`? Returns the
 * score and the ranges of `label` to highlight, or null for no match.
 *
 * Each word must appear as a substring somewhere. Ranking, highest first: the
 * label starting with the word, a word in the label starting with it, a match
 * inside a word, and a match only in the keywords. Ties go to the shorter
 * label, so "tag" ranks Tags, then "Tag report", then "New tag".
 */
export function matchText(query: string, label: string, keywords = ''): Match | null {
  const words = tokens(query);
  if (words.length === 0) return { score: 0, ranges: [] };

  const lower = label.toLowerCase();
  const extra = keywords.toLowerCase();
  let score = 0;
  const ranges: Range[] = [];

  for (const word of words) {
    const at = lower.indexOf(word);
    if (at >= 0) {
      ranges.push([at, at + word.length]);
      if (at === 0) score += 100;
      else if (/\s|-|\//.test(lower[at - 1]!)) score += 60;
      else score += 30;
    } else if (extra.includes(word)) {
      score += 10;
    } else {
      return null;
    }
  }
  // A shorter label is the closer match when the words score the same.
  score -= label.length / 100;
  return { score, ranges: mergeRanges(ranges) };
}

export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [];
  for (const [start, end] of sorted) {
    const last = out.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}

/** Split a label into plain and highlighted segments for rendering. */
export function highlight(label: string, ranges: Range[]): Array<{ text: string; hit: boolean }> {
  const out: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) out.push({ text: label.slice(cursor, start), hit: false });
    out.push({ text: label.slice(start, end), hit: true });
    cursor = end;
  }
  if (cursor < label.length) out.push({ text: label.slice(cursor), hit: false });
  return out;
}

export interface CommandResult {
  entry: CommandEntry;
  ranges: Range[];
  score: number;
}

/**
 * Filter and rank the catalogue. With no query everything is returned in
 * catalogue order, so the palette opens as a full, browsable index.
 */
export function searchCommands(query: string, isAdmin: boolean): CommandResult[] {
  const visible = COMMANDS.filter((entry) => isAdmin || !entry.admin);
  if (tokens(query).length === 0) {
    return visible.map((entry) => ({ entry, ranges: [], score: 0 }));
  }
  const results: CommandResult[] = [];
  for (const entry of visible) {
    const match = matchText(query, entry.label, entry.keywords);
    if (match) results.push({ entry, ...match });
  }
  return results.sort((a, b) => b.score - a.score);
}
