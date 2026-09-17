/**
 * The data classes Firefly can destroy, from the vendored spec's
 * `DataDestroyObject` enum (E19-03).
 *
 * This lives in lib/ rather than beside the action that uses it because a
 * 'use server' file may only export async functions — exporting this array from
 * there fails the build with "A 'use server' file can only export async
 * functions, found object". The same reason `requestMeta` lives apart from the
 * auth actions.
 */
/** The `objects` values Firefly accepts, from the vendored spec. */
export const DESTROYABLE = [
  { value: 'budgets', label: 'Budgets', hint: 'Budgets and their limits.' },
  { value: 'bills', label: 'Subscriptions', hint: 'Bills and their schedules.' },
  { value: 'piggy_banks', label: 'Piggy banks', hint: 'Savings goals and their events.' },
  { value: 'rules', label: 'Rules', hint: 'Every rule and rule group.' },
  {
    value: 'recurring',
    label: 'Recurring transactions',
    hint: 'The schedules, not what they made.',
  },
  { value: 'categories', label: 'Categories', hint: 'Transactions keep their history.' },
  { value: 'tags', label: 'Tags', hint: 'Transactions keep their history.' },
  { value: 'object_groups', label: 'Object groups', hint: 'Groupings only.' },
  { value: 'withdrawals', label: 'All withdrawals', hint: 'Every payment out. No undo.' },
  { value: 'deposits', label: 'All deposits', hint: 'Every payment in. No undo.' },
  { value: 'transfers', label: 'All transfers', hint: 'Every move between accounts. No undo.' },
  { value: 'transactions', label: 'ALL transactions', hint: 'The entire ledger. No undo.' },
  {
    value: 'expense_accounts',
    label: 'Expense accounts',
    hint: 'The places money went, not the payments.',
  },
  {
    value: 'revenue_accounts',
    label: 'Revenue accounts',
    hint: 'The places money came from.',
  },
  { value: 'liabilities', label: 'Liabilities', hint: 'Debts, loans and mortgages.' },
  {
    value: 'asset_accounts',
    label: 'Asset accounts',
    hint: 'Your own accounts and their balances.',
  },
  { value: 'accounts', label: 'ALL accounts', hint: 'Every account of every kind. No undo.' },
  {
    value: 'not_assets_liabilities',
    label: 'Everything except assets and liabilities',
    hint: 'Clears the ledger but keeps the accounts.',
  },
] as const;

export type DestroyableObject = (typeof DESTROYABLE)[number]['value'];

export const DESTROYABLE_VALUES: ReadonlySet<string> = new Set(
  DESTROYABLE.map((entry) => entry.value),
);
