'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import { findAction, findTrigger, needsValue } from '@/lib/rule-vocabulary';
import type { Rule, RuleGroup } from './types';

/** E11-01 … E11-06 — rule and rule-group writes. */

export interface RuleGroupFormState {
  error?: string;
}

export async function createRuleGroupAction(
  _prev: RuleGroupFormState,
  formData: FormData,
): Promise<RuleGroupFormState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!title) return { error: 'Give the group a name.' };

  let created: { data: RuleGroup };
  try {
    created = await fireflyWrite<{ data: RuleGroup }>('/v1/rule-groups', 'POST', {
      title,
      ...(description ? { description } : {}),
      active: true,
    });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/rules');
  redirect(`/rules/groups/${created.data.id}`);
}

export async function updateRuleGroupAction(
  _prev: RuleGroupFormState,
  formData: FormData,
): Promise<RuleGroupFormState> {
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const active = formData.get('active') === 'on';
  if (!id) return { error: 'Missing rule group.' };
  if (!title) return { error: 'Give the group a name.' };

  try {
    await fireflyWrite(`/v1/rule-groups/${id}`, 'PUT', {
      title,
      description: description || null,
      active,
    });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/rules');
  revalidatePath(`/rules/groups/${id}`);
  return {};
}

export async function deleteRuleGroupAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await fireflyWrite(`/v1/rule-groups/${id}`, 'DELETE');
  revalidatePath('/rules');
  redirect('/rules');
}

// --- rules ------------------------------------------------------------------

export interface RuleFormState {
  error?: string;
}

interface Row {
  type: string;
  value: string | null;
  active: boolean;
  stop_processing: boolean;
  prohibited?: boolean;
}

/**
 * Read the repeated `triggers[N][field]` / `actions[N][field]` inputs the
 * builder posts.
 *
 * The indices are not dense: removing the middle row of three leaves 0 and 2,
 * and reindexing in the browser would reset every uncontrolled input below the
 * gap. So the parser collects whatever indices arrive and orders them, rather
 * than counting from zero until it misses.
 */
function readRows(formData: FormData, prefix: 'triggers' | 'actions'): Row[] {
  const indices = new Set<string>();
  const pattern = new RegExp(`^${prefix}\\[(\\d+)\\]\\[type\\]$`);
  for (const key of formData.keys()) {
    const match = pattern.exec(key);
    if (match?.[1]) indices.add(match[1]);
  }

  const rows: Row[] = [];
  // Numeric collation, so row 2 sorts before row 10. The indices stay strings
  // because the money lint rule bans Number() outside lib/money.ts, and an
  // exception for "it is only a form index" is how that rule stops meaning
  // anything.
  const ordered = [...indices].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  for (const index of ordered) {
    const type = String(formData.get(`${prefix}[${index}][type]`) ?? '').trim();
    if (!type) continue;

    const keyword = prefix === 'triggers' ? findTrigger(type) : findAction(type);
    const raw = String(formData.get(`${prefix}[${index}][value]`) ?? '').trim();

    // Firefly stores a value for every row. A presence keyword such as
    // `has_no_category` has nothing to store, and it rejects null outright, so
    // those rows carry an empty string rather than whatever was left in the
    // input before the keyword was changed.
    const value = needsValue(keyword) ? raw : '';

    rows.push({
      type,
      value,
      active: formData.get(`${prefix}[${index}][active]`) !== 'off',
      stop_processing: formData.get(`${prefix}[${index}][stop]`) === 'on',
      ...(prefix === 'triggers'
        ? { prohibited: formData.get(`${prefix}[${index}][prohibited]`) === 'on' }
        : {}),
    });
  }
  return rows;
}

function readRulePayload(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const ruleGroupId = String(formData.get('rule_group_id') ?? '').trim();
  const trigger = String(formData.get('trigger') ?? 'store-journal');
  const triggers = readRows(formData, 'triggers');
  const actions = readRows(formData, 'actions');

  return {
    title,
    ruleGroupId,
    triggers,
    actions,
    payload: {
      title,
      description: description || null,
      rule_group_id: ruleGroupId,
      trigger,
      active: formData.get('active') !== 'off',
      strict: formData.get('strict') !== 'off',
      stop_processing: formData.get('stop_processing') === 'on',
      triggers,
      actions,
    },
  };
}

function validate(parsed: ReturnType<typeof readRulePayload>): string | null {
  if (!parsed.title) return 'Give the rule a name.';
  if (!parsed.ruleGroupId) return 'Pick a group for this rule.';
  if (parsed.triggers.length === 0) return 'A rule needs at least one condition.';
  if (parsed.actions.length === 0) return 'A rule needs at least one action.';

  // Firefly accepts a value-less row and then matches nothing, which reads as
  // "my rule is broken" rather than "I left a box empty".
  const blankTrigger = parsed.triggers.find(
    (row) => needsValue(findTrigger(row.type)) && !row.value,
  );
  if (blankTrigger) return `Fill in a value for the "${blankTrigger.type}" condition.`;

  const blankAction = parsed.actions.find((row) => needsValue(findAction(row.type)) && !row.value);
  if (blankAction) return `Fill in a value for the "${blankAction.type}" action.`;

  return null;
}

export async function createRuleAction(
  _prev: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const parsed = readRulePayload(formData);
  const problem = validate(parsed);
  if (problem) return { error: problem };

  let created: { data: Rule };
  try {
    created = await fireflyWrite<{ data: Rule }>('/v1/rules', 'POST', parsed.payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/rules');
  redirect(`/rules/${created.data.id}`);
}

export async function updateRuleAction(
  _prev: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const id = String(formData.get('id') ?? '');
  const parsed = readRulePayload(formData);
  if (!id) return { error: 'Missing rule.' };
  const problem = validate(parsed);
  if (problem) return { error: problem };

  try {
    await fireflyWrite(`/v1/rules/${id}`, 'PUT', parsed.payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/rules');
  revalidatePath(`/rules/${id}`);
  return {};
}

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await fireflyWrite(`/v1/rules/${id}`, 'DELETE');
  revalidatePath('/rules');
  redirect('/rules');
}

export async function toggleRuleAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';
  if (!id) return;
  await fireflyWrite(`/v1/rules/${id}`, 'PUT', { active });
  revalidatePath('/rules');
  revalidatePath(`/rules/${id}`);
}

export interface RunState {
  error?: string;
  ok?: boolean;
  message?: string;
}

/**
 * E11-05 — run a rule, or a whole group, over a date range.
 *
 * Firefly answers 204 with an empty body, so there is nothing to report but
 * the fact that it finished. `JSON.parse('')` on that empty body is the same
 * trap the delete paths hit in M3; `fireflyWrite` handles it centrally.
 */
export async function triggerRuleAction(_prev: RunState, formData: FormData): Promise<RunState> {
  const id = String(formData.get('id') ?? '');
  const scope = String(formData.get('scope') ?? 'rule');
  const start = String(formData.get('start') ?? '').trim();
  const end = String(formData.get('end') ?? '').trim();
  if (!id) return { error: 'Missing rule.' };
  if (!start || !end) return { error: 'Pick a date range to run over.' };

  const path = scope === 'group' ? `/v1/rule-groups/${id}/trigger` : `/v1/rules/${id}/trigger`;

  try {
    await fireflyWrite(`${path}?start=${start}&end=${end}`, 'POST', {});
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  // The run rewrites transactions in place, so everything that reads them is
  // now stale.
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/rules');
  return {
    ok: true,
    message: 'Finished. Firefly does not report how many transactions it changed.',
  };
}
