'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createRuleGroupAction,
  updateRuleGroupAction,
  type RuleGroupFormState,
} from '@/server/firefly/rule-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';
import type { RuleGroup } from '@/server/firefly/types';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

export function RuleGroupForm({ group }: { group?: RuleGroup }) {
  const editing = Boolean(group);
  const [state, action] = useActionState<RuleGroupFormState, FormData>(
    editing ? updateRuleGroupAction : createRuleGroupAction,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      {group ? <input type="hidden" name="id" value={group.id} /> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Name</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={group?.attributes.title}
              placeholder="Everyday filing"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={group?.attributes.description ?? ''}
            />
          </div>
          {editing ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={group?.attributes.active}
                className="size-4"
              />
              Active — an inactive group runs none of its rules
            </label>
          ) : null}
        </CardContent>
      </Card>

      <Submit label={editing ? 'Save group' : 'Create group'} />
    </form>
  );
}
