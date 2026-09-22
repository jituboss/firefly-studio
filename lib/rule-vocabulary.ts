/**
 * The trigger and action vocabularies a Firefly rule is built from (E11-02).
 *
 * The keyword lists are the enums from the vendored spec — 36 triggers and 22
 * actions — not a hand-picked subset, so the builder can express any rule
 * Firefly can run. What the spec does NOT record is which keywords take a
 * value: `amount_more` needs one, `has_no_category` does not, and sending a
 * value for the second is meaningless while omitting it for the first produces
 * a rule that silently matches nothing. That distinction is added here.
 */

export type ValueKind = 'text' | 'amount' | 'none' | 'transaction-type' | 'bill';

export interface Keyword {
  value: string;
  label: string;
  kind: ValueKind;
  /** Grouping for the picker, so 36 options are not one flat list. */
  group: string;
  /**
   * The `/autocomplete/*` endpoint whose names are valid here, when there is
   * one.
   *
   * Only ever set on keywords that match or set a whole NAME. The `_contains`,
   * `_starts` and `_ends` triggers match a fragment, and offering a list of
   * complete names in front of a box that wants "Amaz" is a picker that is
   * wrong about its own job — every suggestion it makes is a value the trigger
   * will still match, but none of them is what the user is writing.
   */
  autocomplete?: string;
  /**
   * Narrows an account picker to the types this keyword can actually take, via
   * Firefly's `types=` parameter. Offering every account for "convert to
   * withdrawal, paying" would list asset accounts that Firefly then rejects.
   */
  accountTypes?: string;
}

/** Firefly's own three transaction types, for `transaction_type`. */
export const TRANSACTION_TYPES = ['withdrawal', 'deposit', 'transfer'] as const;

export const RULE_TRIGGERS: Keyword[] = [
  { value: 'description_is', label: 'Description is', kind: 'text', group: 'Description' },
  {
    value: 'description_contains',
    label: 'Description contains',
    kind: 'text',
    group: 'Description',
  },
  {
    value: 'description_starts',
    label: 'Description starts with',
    kind: 'text',
    group: 'Description',
  },
  { value: 'description_ends', label: 'Description ends with', kind: 'text', group: 'Description' },

  { value: 'amount_exactly', label: 'Amount is exactly', kind: 'amount', group: 'Amount' },
  { value: 'amount_more', label: 'Amount is more than', kind: 'amount', group: 'Amount' },
  { value: 'amount_less', label: 'Amount is less than', kind: 'amount', group: 'Amount' },

  {
    value: 'from_account_is',
    autocomplete: 'accounts',
    label: 'Source account is',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'from_account_contains',
    label: 'Source account contains',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'from_account_starts',
    label: 'Source account starts with',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'from_account_ends',
    label: 'Source account ends with',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'source_account_is',
    autocomplete: 'accounts',
    label: 'Source account matches',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'source_account_starts',
    label: 'Source account begins',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'to_account_is',
    autocomplete: 'accounts',
    label: 'Destination account is',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'to_account_contains',
    label: 'Destination account contains',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'to_account_starts',
    label: 'Destination account starts with',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'to_account_ends',
    label: 'Destination account ends with',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'destination_account_is',
    autocomplete: 'accounts',
    label: 'Destination account matches',
    kind: 'text',
    group: 'Accounts',
  },

  {
    value: 'category_is',
    autocomplete: 'categories',
    label: 'Category is',
    kind: 'text',
    group: 'Classification',
  },
  {
    value: 'budget_is',
    autocomplete: 'budgets',
    label: 'Budget is',
    kind: 'text',
    group: 'Classification',
  },
  { value: 'tag_is', autocomplete: 'tags', label: 'Tag is', kind: 'text', group: 'Classification' },
  { value: 'currency_is', label: 'Currency is', kind: 'text', group: 'Classification' },
  {
    value: 'transaction_type',
    label: 'Transaction type is',
    kind: 'transaction-type',
    group: 'Classification',
  },

  { value: 'notes_are', label: 'Notes are', kind: 'text', group: 'Notes' },
  { value: 'notes_contains', label: 'Notes contain', kind: 'text', group: 'Notes' },
  { value: 'notes_starts', label: 'Notes start with', kind: 'text', group: 'Notes' },
  { value: 'notes_end', label: 'Notes end with', kind: 'text', group: 'Notes' },

  { value: 'has_any_category', label: 'Has any category', kind: 'none', group: 'Presence' },
  { value: 'has_no_category', label: 'Has no category', kind: 'none', group: 'Presence' },
  { value: 'has_any_budget', label: 'Has any budget', kind: 'none', group: 'Presence' },
  { value: 'has_no_budget', label: 'Has no budget', kind: 'none', group: 'Presence' },
  { value: 'has_any_tag', label: 'Has any tag', kind: 'none', group: 'Presence' },
  { value: 'has_no_tag', label: 'Has no tag', kind: 'none', group: 'Presence' },
  { value: 'any_notes', label: 'Has notes', kind: 'none', group: 'Presence' },
  { value: 'no_notes', label: 'Has no notes', kind: 'none', group: 'Presence' },
  { value: 'has_attachments', label: 'Has attachments', kind: 'none', group: 'Presence' },
];

/**
 * `user_action` is in the spec's action enum but is Firefly's own internal
 * marker rather than something a person composes, so it is not offered.
 */
export const RULE_ACTIONS: Keyword[] = [
  {
    value: 'set_category',
    autocomplete: 'categories',
    label: 'Set category to',
    kind: 'text',
    group: 'Classification',
  },
  { value: 'clear_category', label: 'Clear the category', kind: 'none', group: 'Classification' },
  {
    value: 'set_budget',
    autocomplete: 'budgets',
    label: 'Set budget to',
    kind: 'text',
    group: 'Classification',
  },
  { value: 'clear_budget', label: 'Clear the budget', kind: 'none', group: 'Classification' },
  { value: 'add_tag', autocomplete: 'tags', label: 'Add tag', kind: 'text', group: 'Tags' },
  { value: 'remove_tag', autocomplete: 'tags', label: 'Remove tag', kind: 'text', group: 'Tags' },
  { value: 'remove_all_tags', label: 'Remove all tags', kind: 'none', group: 'Tags' },

  { value: 'set_description', label: 'Set description to', kind: 'text', group: 'Description' },
  {
    value: 'append_description',
    label: 'Append to description',
    kind: 'text',
    group: 'Description',
  },
  {
    value: 'prepend_description',
    label: 'Prepend to description',
    kind: 'text',
    group: 'Description',
  },

  { value: 'set_notes', label: 'Set notes to', kind: 'text', group: 'Notes' },
  { value: 'append_notes', label: 'Append to notes', kind: 'text', group: 'Notes' },
  { value: 'prepend_notes', label: 'Prepend to notes', kind: 'text', group: 'Notes' },
  { value: 'clear_notes', label: 'Clear the notes', kind: 'none', group: 'Notes' },

  {
    value: 'set_source_account',
    autocomplete: 'accounts',
    label: 'Set source account to',
    kind: 'text',
    group: 'Accounts',
  },
  {
    value: 'set_destination_account',
    autocomplete: 'accounts',
    label: 'Set destination account to',
    kind: 'text',
    group: 'Accounts',
  },
  /*
   * `bill`, not `text`, because Firefly hard-validates this one. The value is
   * the subscription's NAME — an id is rejected with
   * "This value is invalid for the selected action." (422), and so is any name
   * that does not exist. Verified against 6.5.5: posting the bill id 34 fails
   * while posting "Netflix" succeeds.
   *
   * A free-text box in front of a field that only accepts one of six exact
   * strings is a guessing game whose only feedback is a 422 after save, so the
   * builder renders a picker for this kind instead.
   *
   * Renaming the subscription afterwards is safe — Firefly stores the id
   * internally and the action's value follows the rename. Also verified, and
   * worth recording because the opposite is the obvious assumption.
   */
  {
    value: 'link_to_bill',
    autocomplete: 'bills',
    label: 'Link to subscription',
    kind: 'bill',
    group: 'Accounts',
  },

  {
    value: 'convert_withdrawal',
    autocomplete: 'accounts',
    accountTypes: 'Expense account',
    label: 'Convert to withdrawal, paying',
    kind: 'text',
    group: 'Convert',
  },
  {
    value: 'convert_deposit',
    autocomplete: 'accounts',
    accountTypes: 'Revenue account',
    label: 'Convert to deposit, from',
    kind: 'text',
    group: 'Convert',
  },
  {
    value: 'convert_transfer',
    autocomplete: 'accounts',
    accountTypes: 'Asset account',
    label: 'Convert to transfer, to',
    kind: 'text',
    group: 'Convert',
  },

  { value: 'delete_transaction', label: 'Delete the transaction', kind: 'none', group: 'Danger' },
];

export const RULE_TRIGGER_MODES = [
  {
    value: 'store-journal',
    label: 'When a transaction is created',
    hint: 'Runs on anything new, however it arrives.',
  },
  {
    value: 'update-journal',
    label: 'When a transaction is changed',
    hint: 'Runs again whenever an existing transaction is edited.',
  },
  {
    value: 'manual-activation',
    label: 'Only when I run it',
    hint: 'Never fires on its own — useful while you are still tuning it.',
  },
] as const;

const triggerIndex = new Map(RULE_TRIGGERS.map((entry) => [entry.value, entry]));
const actionIndex = new Map(RULE_ACTIONS.map((entry) => [entry.value, entry]));

export function findTrigger(value: string): Keyword | undefined {
  return triggerIndex.get(value);
}

export function findAction(value: string): Keyword | undefined {
  return actionIndex.get(value);
}

/**
 * Does this keyword need a value from the user? Unknown keywords are treated as
 * needing one: a rule from a newer Firefly should keep its value on a round
 * trip through this UI rather than being silently emptied.
 */
export function needsValue(keyword: Keyword | undefined): boolean {
  return keyword?.kind !== 'none';
}

/** Group a vocabulary for a picker, preserving the declared order. */
export function byGroup(keywords: Keyword[]): Array<{ group: string; items: Keyword[] }> {
  const groups: Array<{ group: string; items: Keyword[] }> = [];
  for (const keyword of keywords) {
    const existing = groups.find((entry) => entry.group === keyword.group);
    if (existing) existing.items.push(keyword);
    else groups.push({ group: keyword.group, items: [keyword] });
  }
  return groups;
}

/** Human summary of one condition or action, for list rows. */
export function describeKeyword(keyword: Keyword | undefined, value: string | null): string {
  if (!keyword) return value ? `${'Unknown condition'} (${value})` : 'Unknown condition';
  if (!needsValue(keyword)) return keyword.label;
  return `${keyword.label} ${value ?? ''}`.trim();
}
