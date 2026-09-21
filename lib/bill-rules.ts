/**
 * E8-07 — which rules are wired to which subscription.
 *
 * Firefly has no endpoint for this. A rule's connection to a subscription is
 * one `link_to_bill` action carrying the subscription's NAME as its value, and
 * `/bills/{id}` says nothing about the rules pointing at it, so the only way to
 * answer "what automates this subscription?" is to read every rule and look.
 *
 * Kept pure and out of `server/` so the matching itself can be tested without a
 * Firefly instance — the shape it depends on is the part most likely to shift
 * under a Firefly upgrade.
 */

/** The minimum shape this needs; `Rule` from server/firefly/types satisfies it. */
export interface RuleLike {
  id: string;
  attributes: {
    title: string;
    active: boolean;
    actions: Array<{ type: string; value: string | null }>;
    triggers: Array<{ type: string; value: string }>;
  };
}

export const LINK_TO_BILL = 'link_to_bill';

/**
 * Case-insensitive, and trimmed.
 *
 * Firefly stores the link by id internally and rewrites the action's value when
 * the subscription is renamed, so an exact match is what you would normally
 * get. The looser comparison is here for the cases that escape that: a value
 * typed by hand before this picker existed, or one restored from an export.
 * A false negative here is silent — the tab simply says no rules — which is a
 * worse failure than showing a rule whose casing differs.
 */
const same = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

/** Every rule that links a transaction to this subscription. */
export function rulesLinkedToBill<T extends RuleLike>(rules: T[], billName: string): T[] {
  if (!billName.trim()) return [];
  return rules.filter((rule) =>
    rule.attributes.actions.some(
      (action) => action.type === LINK_TO_BILL && same(action.value, billName),
    ),
  );
}

/** The subscription names a single rule links to — usually none, rarely one. */
export function billNamesLinkedByRule(rule: RuleLike): string[] {
  return rule.attributes.actions
    .filter((action) => action.type === LINK_TO_BILL && action.value)
    .map((action) => action.value as string);
}

/**
 * A one-line summary of what a linked rule matches on, for the subscription's
 * Rules tab.
 *
 * Conditions only, and only the ones carrying a value: the reader already knows
 * the rule links to this subscription — that is why it is in the list — so
 * repeating the action tells them nothing. What they came to find out is what
 * makes it fire.
 */
export function describeRuleMatch(rule: RuleLike, max = 3): string {
  const parts = rule.attributes.triggers
    .filter((trigger) => trigger.value)
    .map((trigger) => trigger.value);
  if (parts.length === 0) return 'Matches on conditions with no text value.';
  const shown = parts.slice(0, max).join(', ');
  return parts.length > max ? `${shown} +${parts.length - max} more` : shown;
}
