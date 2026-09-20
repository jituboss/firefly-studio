'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Play, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import {
  deleteRecurrenceAction,
  triggerRecurrenceAction,
  type TriggerState,
} from '@/server/firefly/recurrence-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';

function RunSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Play className="size-4" aria-hidden="true" />
      {pending ? 'Creating…' : 'Create it now'}
    </Button>
  );
}

/**
 * E10-04 — fire this recurrence by hand for a given date.
 *
 * Firefly wants a single `date`. Passing a start/end pair instead is answered
 * with a 500 rather than a validation error, so the form offers one date only.
 */
export function TriggerPanel({ id, today }: { id: string; today: string }) {
  const [state, action] = useActionState<TriggerState, FormData>(triggerRecurrenceAction, {});

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium">Create one now</p>
          <p className="text-muted-foreground text-sm">
            Makes the transaction immediately, without waiting for the schedule.
          </p>
        </div>

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        {state.ok ? (
          <FormMessage tone="notice">
            {state.created === 1
              ? 'Created 1 transaction.'
              : `Created ${state.created} transactions.`}
          </FormMessage>
        ) : null}

        <form action={action} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={id} />
          <div className="space-y-1.5">
            <Label htmlFor="trigger-date">Date</Label>
            <Input id="trigger-date" name="date" type="date" defaultValue={today} />
          </div>
          <RunSubmit />
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteRecurrenceButton({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteRecurrenceAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        message={`Delete "${title}"? Transactions it already created stay where they are.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </ConfirmButton>
    </form>
  );
}
