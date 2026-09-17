'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Play, Trash2 } from 'lucide-react';
import { deleteRuleAction, triggerRuleAction, type RunState } from '@/server/firefly/rule-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';

function RunSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Play className="size-4" aria-hidden="true" />
      {pending ? 'Running…' : 'Run now'}
    </Button>
  );
}

/**
 * E11-05 — run a rule over existing transactions.
 *
 * Separated from the dry-run on purpose. The test is a GET and changes nothing;
 * this rewrites history in place and cannot be undone, so it asks first and
 * defaults to a narrow window rather than the whole ledger.
 */
export function RunPanel({
  id,
  scope,
  start,
  end,
}: {
  id: string;
  scope: 'rule' | 'group';
  start: string;
  end: string;
}) {
  const [state, action] = useActionState<RunState, FormData>(triggerRuleAction, {});

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium">Apply to existing transactions</p>
          <p className="text-muted-foreground text-sm">
            This changes transactions in place and cannot be undone. Check the matches above first.
          </p>
        </div>

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        {state.ok && state.message ? (
          <FormMessage tone="notice">{state.message}</FormMessage>
        ) : null}

        <form
          action={action}
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            if (!confirm('Apply this rule to every matching transaction in the range?')) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="scope" value={scope} />
          <div className="space-y-1.5">
            <Label htmlFor="run-start">From</Label>
            <Input id="run-start" name="start" type="date" defaultValue={start} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="run-end">To</Label>
            <Input id="run-end" name="end" type="date" defaultValue={end} />
          </div>
          <RunSubmit />
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="size-4" aria-hidden="true" />
      {pending ? 'Deleting…' : 'Delete rule'}
    </Button>
  );
}

export function DeleteRuleButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteRuleAction}
      onSubmit={(event) => {
        if (!confirm(`Delete "${title}"? Transactions it already changed keep those changes.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteSubmit />
    </form>
  );
}
