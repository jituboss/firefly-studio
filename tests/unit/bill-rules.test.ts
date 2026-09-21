import { describe, expect, it } from 'vitest';
import {
  billNamesLinkedByRule,
  describeRuleMatch,
  rulesLinkedToBill,
  type RuleLike,
} from '@/lib/bill-rules';

const rule = (
  id: string,
  actions: Array<[string, string | null]>,
  triggers: Array<[string, string]> = [['description_contains', 'netflix']],
): RuleLike => ({
  id,
  attributes: {
    title: `Rule ${id}`,
    active: true,
    actions: actions.map(([type, value]) => ({ type, value })),
    triggers: triggers.map(([type, value]) => ({ type, value })),
  },
});

describe('rulesLinkedToBill', () => {
  it('finds the rule whose link_to_bill action names the subscription', () => {
    const rules = [rule('1', [['link_to_bill', 'Netflix']]), rule('2', [['set_category', 'Fun']])];
    expect(rulesLinkedToBill(rules, 'Netflix').map((r) => r.id)).toEqual(['1']);
  });

  it('ignores a value that belongs to a different action type', () => {
    // set_description "Netflix" is not a link; counting it would list a rule
    // on a subscription it has nothing to do with.
    const rules = [rule('1', [['set_description', 'Netflix']])];
    expect(rulesLinkedToBill(rules, 'Netflix')).toHaveLength(0);
  });

  it('matches regardless of case and surrounding space', () => {
    const rules = [rule('1', [['link_to_bill', '  netflix ']])];
    expect(rulesLinkedToBill(rules, 'Netflix')).toHaveLength(1);
  });

  it('returns nothing for a blank subscription name', () => {
    // Otherwise a bill with an empty name would match every rule whose
    // link_to_bill value is also empty, which is every malformed rule.
    const rules = [rule('1', [['link_to_bill', '']])];
    expect(rulesLinkedToBill(rules, '   ')).toHaveLength(0);
  });

  it('finds a rule that links to several subscriptions', () => {
    const rules = [
      rule('1', [
        ['link_to_bill', 'Spotify'],
        ['link_to_bill', 'Netflix'],
      ]),
    ];
    expect(rulesLinkedToBill(rules, 'Netflix')).toHaveLength(1);
    expect(billNamesLinkedByRule(rules[0]!)).toEqual(['Spotify', 'Netflix']);
  });
});

describe('describeRuleMatch', () => {
  it('lists the condition values', () => {
    expect(describeRuleMatch(rule('1', [], [['description_contains', 'netflix']]))).toBe('netflix');
  });

  it('truncates a long list rather than filling the row', () => {
    const many = rule(
      '1',
      [],
      [
        ['description_contains', 'a'],
        ['description_contains', 'b'],
        ['description_contains', 'c'],
        ['description_contains', 'd'],
      ],
    );
    expect(describeRuleMatch(many)).toBe('a, b, c +1 more');
  });

  it('says so when no condition carries text', () => {
    // has_no_category and friends take no value; printing an empty string
    // would render a row that looks like a rendering bug.
    const valueless = rule('1', [], [['has_no_category', '']]);
    expect(describeRuleMatch(valueless)).toMatch(/no text value/);
  });
});
