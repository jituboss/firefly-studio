import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  RULE_ACTIONS,
  RULE_TRIGGERS,
  RULE_TRIGGER_MODES,
  byGroup,
  describeKeyword,
  findAction,
  findTrigger,
  needsValue,
} from '@/lib/rule-vocabulary';

/**
 * Read an enum straight out of the vendored spec. The point of these tests is
 * that the builder's vocabulary cannot quietly fall behind Firefly's: a spec
 * update that adds a trigger should redden here rather than produce a UI that
 * silently cannot express the new rule.
 */
function specEnum(name: string): string[] {
  const spec = readFileSync('spec/firefly-iii-v1.yaml', 'utf8');
  const block = new RegExp(`\\n    ${name}:\\n([\\s\\S]*?)(?=\\n    [A-Za-z])`).exec(spec);
  if (!block) throw new Error(`${name} not found in the vendored spec`);
  return [...block[1]!.matchAll(/^\s+- '?([a-z_-]+)'?\s*$/gm)].map((match) => match[1]!);
}

describe('rule vocabulary', () => {
  it('offers every trigger keyword the spec defines', () => {
    const offered = new Set(RULE_TRIGGERS.map((entry) => entry.value));
    const missing = specEnum('RuleTriggerKeyword').filter((value) => !offered.has(value));
    expect(missing).toEqual([]);
  });

  it('offers every action keyword except Firefly’s internal marker', () => {
    const offered = new Set(RULE_ACTIONS.map((entry) => entry.value));
    const missing = specEnum('RuleActionKeyword').filter((value) => !offered.has(value));
    // `user_action` is Firefly's own bookkeeping, not something a person picks.
    expect(missing).toEqual(['user_action']);
  });

  it('invents no keyword the spec does not have', () => {
    const triggers = new Set(specEnum('RuleTriggerKeyword'));
    const actions = new Set(specEnum('RuleActionKeyword'));
    expect(RULE_TRIGGERS.filter((entry) => !triggers.has(entry.value))).toEqual([]);
    expect(RULE_ACTIONS.filter((entry) => !actions.has(entry.value))).toEqual([]);
  });

  it('matches the spec on the three firing modes', () => {
    expect(RULE_TRIGGER_MODES.map((entry) => entry.value)).toEqual(specEnum('RuleTriggerType'));
  });

  it('has no duplicate keywords', () => {
    const values = RULE_TRIGGERS.map((entry) => entry.value);
    expect(new Set(values).size).toBe(values.length);
    const actions = RULE_ACTIONS.map((entry) => entry.value);
    expect(new Set(actions).size).toBe(actions.length);
  });
});

describe('needsValue', () => {
  it('is false only for presence-style keywords', () => {
    expect(needsValue(findTrigger('has_no_category'))).toBe(false);
    expect(needsValue(findTrigger('has_attachments'))).toBe(false);
    expect(needsValue(findAction('remove_all_tags'))).toBe(false);
  });

  it('is true for keywords that carry a value', () => {
    expect(needsValue(findTrigger('amount_more'))).toBe(true);
    expect(needsValue(findTrigger('description_contains'))).toBe(true);
    expect(needsValue(findAction('add_tag'))).toBe(true);
  });

  it('treats an unknown keyword as needing a value', () => {
    // A rule created on a newer Firefly must keep its value on a round trip
    // rather than being emptied by a UI that does not recognise it.
    expect(needsValue(undefined)).toBe(true);
    expect(needsValue(findTrigger('invented_by_a_future_release'))).toBe(true);
  });
});

describe('byGroup', () => {
  it('preserves declaration order and groups contiguously', () => {
    const grouped = byGroup(RULE_TRIGGERS);
    expect(grouped[0]!.group).toBe('Description');
    expect(grouped.map((entry) => entry.group)).toEqual([
      ...new Set(RULE_TRIGGERS.map((entry) => entry.group)),
    ]);
  });

  it('loses nothing', () => {
    const total = byGroup(RULE_ACTIONS).reduce((sum, entry) => sum + entry.items.length, 0);
    expect(total).toBe(RULE_ACTIONS.length);
  });
});

describe('describeKeyword', () => {
  it('omits the value for presence keywords', () => {
    expect(describeKeyword(findTrigger('has_no_budget'), null)).toBe('Has no budget');
    // Even if a value somehow came back, it is not part of the meaning.
    expect(describeKeyword(findTrigger('has_no_budget'), 'true')).toBe('Has no budget');
  });

  it('includes the value otherwise', () => {
    expect(describeKeyword(findTrigger('description_contains'), 'coffee')).toBe(
      'Description contains coffee',
    );
  });

  it('does not leave a dangling space when the value is missing', () => {
    expect(describeKeyword(findAction('add_tag'), null)).toBe('Add tag');
  });

  it('says so when the keyword is unrecognised', () => {
    expect(describeKeyword(undefined, 'x')).toBe('Unknown condition (x)');
    expect(describeKeyword(undefined, null)).toBe('Unknown condition');
  });
});
