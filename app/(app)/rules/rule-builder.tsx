'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, X } from 'lucide-react';
import {
  createRuleAction,
  updateRuleAction,
  type RuleFormState,
} from '@/server/firefly/rule-actions';
import {
  RULE_ACTIONS,
  RULE_TRIGGERS,
  RULE_TRIGGER_MODES,
  byGroup,
  findAction,
  findTrigger,
  needsValue,
  type Keyword,
} from '@/lib/rule-vocabulary';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RuleValueField } from './value-field';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { Rule, RuleGroup } from '@/server/firefly/types';

interface RowState {
  /** Stable across removals, so React keeps each row's DOM and its input. */
  key: number;
  type: string;
  value: string;
  active: boolean;
  stop: boolean;
  prohibited: boolean;
}

let nextKey = 0;
const makeRow = (type: string): RowState => ({
  key: nextKey++,
  type,
  value: '',
  active: true,
  stop: false,
  prohibited: false,
});

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

function KeywordSelect({
  name,
  vocabulary,
  value,
  onChange,
  label,
}: {
  name: string;
  vocabulary: Keyword[];
  value: string;
  onChange: (next: string) => void;
  /**
   * The accessible name. Required, because without one axe reports
   * `select-name` at critical and a screen reader announces the row as a bare
   * combo box — on a page whose whole content is rows of unlabelled selects,
   * that is the difference between a form and a wall of "combo box, Set
   * category to".
   */
  label: string;
}) {
  return (
    <Select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
    >
      {byGroup(vocabulary).map((group) => (
        <optgroup key={group.group} label={group.group}>
          {group.items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}

function RowEditor({
  prefix,
  index,
  row,
  vocabulary,
  onChange,
  onRemove,
  removable,
}: {
  prefix: 'triggers' | 'actions';
  index: number;
  row: RowState;
  vocabulary: Keyword[];
  onChange: (next: RowState) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const keyword = prefix === 'triggers' ? findTrigger(row.type) : findAction(row.type);
  const wantsValue = needsValue(keyword);
  const base = `${prefix}[${index}]`;

  return (
    <div className="bg-muted/40 rounded-lg border p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1 basis-56">
          <KeywordSelect
            name={`${base}[type]`}
            vocabulary={vocabulary}
            value={row.type}
            onChange={(type) => onChange({ ...row, type })}
            label={prefix === 'triggers' ? `Condition ${index + 1}` : `Action ${index + 1}`}
          />
        </div>

        <div className="min-w-0 flex-1 basis-48">
          {wantsValue ? (
            /*
             * One control for every value, because the choices are alternatives
             * rather than a list: a picker where the keyword names a thing, a
             * select where Firefly takes one of three words, and an expression
             * editor the moment the value starts with `=`. See value-field.tsx.
             */
            <RuleValueField
              name={`${base}[value]`}
              keyword={keyword}
              value={row.value}
              onChange={(value) => onChange({ ...row, value })}
              label={
                prefix === 'triggers'
                  ? `Value for condition ${index + 1}`
                  : `Value for action ${index + 1}`
              }
            />
          ) : (
            <p className="text-muted-foreground px-1 py-2 text-xs">Nothing more to fill in.</p>
          )}
        </div>

        {removable ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label="Remove this row"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {prefix === 'triggers' ? (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              name={`${base}[prohibited]`}
              checked={row.prohibited}
              onChange={(event) => onChange({ ...row, prohibited: event.target.checked })}
              className="size-3.5"
            />
            Invert — match when this is NOT true
          </label>
        ) : null}
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name={`${base}[stop]`}
            checked={row.stop}
            onChange={(event) => onChange({ ...row, stop: event.target.checked })}
            className="size-3.5"
          />
          Stop after this one
        </label>
        {/* Posted so an unchecked box still means "active": an absent checkbox
            is indistinguishable from a removed row otherwise. */}
        <input type="hidden" name={`${base}[active]`} value={row.active ? 'on' : 'off'} />
      </div>
    </div>
  );
}

/**
 * A starting point handed in by whoever linked here — today, the "Create a
 * matching rule" button on a subscription (E8-07).
 *
 * Deliberately a set of DEFAULTS, not a locked form: it fills the rows in and
 * then gets out of the way, so the description guess can be corrected before
 * saving. A rule built from a subscription name is a good first guess and
 * nothing more — "Netflix" matches the subscription, but the bank may well
 * write it "NETFLIX.COM 866-579-7172".
 */
export interface RulePrefill {
  title?: string;
  triggers?: Array<{ type: string; value: string }>;
  actions?: Array<{ type: string; value: string }>;
}

/** E11-02 / E11-03 — compose a rule out of conditions and actions. */
export function RuleBuilder({
  rule,
  groups,
  defaultGroupId,
  prefill,
}: {
  rule?: Rule;
  groups: RuleGroup[];
  defaultGroupId?: string;
  prefill?: RulePrefill;
}) {
  const editing = Boolean(rule);
  const [state, action] = useActionState<RuleFormState, FormData>(
    editing ? updateRuleAction : createRuleAction,
    {},
  );

  const [triggers, setTriggers] = useState<RowState[]>(() =>
    rule?.attributes.triggers.length
      ? rule.attributes.triggers.map((entry) => ({
          key: nextKey++,
          type: entry.type,
          value: entry.value ?? '',
          active: entry.active,
          stop: entry.stop_processing,
          prohibited: Boolean(entry.prohibited),
        }))
      : prefill?.triggers?.length
        ? prefill.triggers.map((entry) => ({ ...makeRow(entry.type), value: entry.value }))
        : [makeRow('description_contains')],
  );

  const [actions, setActions] = useState<RowState[]>(() =>
    rule?.attributes.actions.length
      ? rule.attributes.actions.map((entry) => ({
          key: nextKey++,
          type: entry.type,
          value: entry.value ?? '',
          active: entry.active,
          stop: entry.stop_processing,
          prohibited: false,
        }))
      : prefill?.actions?.length
        ? prefill.actions.map((entry) => ({ ...makeRow(entry.type), value: entry.value }))
        : [makeRow('set_category')],
  );

  const patch = (
    list: RowState[],
    setList: (next: RowState[]) => void,
    key: number,
    next: RowState,
  ) => setList(list.map((row) => (row.key === key ? next : row)));

  return (
    <form action={action} className="space-y-5">
      {rule ? <input type="hidden" name="id" value={rule.id} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Name</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={rule?.attributes.title ?? prefill?.title}
              placeholder="Tag the weekly shop"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={rule?.attributes.description ?? ''}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rule_group_id">Group</Label>
              <Select
                id="rule_group_id"
                name="rule_group_id"
                defaultValue={rule?.attributes.rule_group_id ?? defaultGroupId ?? groups[0]?.id}
                className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.attributes.title}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trigger">Run it</Label>
              <Select
                id="trigger"
                name="trigger"
                defaultValue={rule?.attributes.trigger ?? 'store-journal'}
                className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
              >
                {RULE_TRIGGER_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Conditions</p>
              <p className="text-muted-foreground text-xs">
                Which transactions this rule is about.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTriggers([...triggers, makeRow('description_contains')])}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add condition
            </Button>
          </div>

          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="strict"
              defaultChecked={rule ? rule.attributes.strict : true}
              className="size-4"
            />
            All conditions must match — untick to match any one of them
          </label>

          <div className="space-y-2">
            {triggers.map((row, index) => (
              <RowEditor
                key={row.key}
                prefix="triggers"
                index={index}
                row={row}
                vocabulary={RULE_TRIGGERS}
                removable={triggers.length > 1}
                onChange={(next) => patch(triggers, setTriggers, row.key, next)}
                onRemove={() => setTriggers(triggers.filter((entry) => entry.key !== row.key))}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Actions</p>
              <p className="text-muted-foreground text-xs">What happens to a match.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActions([...actions, makeRow('add_tag')])}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add action
            </Button>
          </div>

          <div className="space-y-2">
            {actions.map((row, index) => (
              <RowEditor
                key={row.key}
                prefix="actions"
                index={index}
                row={row}
                vocabulary={RULE_ACTIONS}
                removable={actions.length > 1}
                onChange={(next) => patch(actions, setActions, row.key, next)}
                onRemove={() => setActions(actions.filter((entry) => entry.key !== row.key))}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={rule ? rule.attributes.active : true}
              className="size-4"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="stop_processing"
              defaultChecked={rule ? rule.attributes.stop_processing : false}
              className="size-4"
            />
            Stop processing later rules in this group once this one matches
          </label>
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save rule' : 'Create rule'} />
    </form>
  );
}
