'use client';

import { useActionState, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/confirm';
import { destroyDataAction, type DestroyState } from '@/server/firefly/data-actions';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';

interface Option {
  value: string;
  label: string;
  hint: string;
}

/** E19-03 — pick, type the phrase, confirm. */
export function DangerForm({ options, elevated }: { options: Option[]; elevated: boolean }) {
  const [state, action] = useActionState<DestroyState, FormData>(destroyDataAction, {});
  const [objects, setObjects] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const selected = options.find((option) => option.value === objects);
  // The button stays inert until the typed phrase matches, so the confirmation
  // is a deliberate act rather than a dialog to dismiss.
  const matches = objects !== '' && confirmation === objects;

  return (
    <form action={action} className="space-y-4">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.ok && state.destroyed ? (
        <FormMessage tone="notice">
          {`Deleted ${state.destroyed}. Firefly does not report how many records that was.`}
        </FormMessage>
      ) : null}

      <Card className="border-expense/40">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-expense mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Delete data from Firefly III</p>
              <p className="text-muted-foreground text-sm">
                This removes records from the connected instance. There is no undo and no backup is
                taken first — export anything you want to keep before using this.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="objects">What to delete</Label>
            <Select
              id="objects"
              name="objects"
              value={objects}
              onChange={(event) => {
                setObjects(event.target.value);
                setConfirmation('');
              }}
              className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">Choose…</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {selected ? <p className="text-muted-foreground text-xs">{selected.hint}</p> : null}
          </div>

          {objects ? (
            <div className="space-y-1.5">
              <Label htmlFor="confirmation">
                Type <span className="font-mono">{objects}</span> to confirm
              </Label>
              <Input
                id="confirmation"
                name="confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                className="font-mono"
              />
            </div>
          ) : null}

          {elevated ? null : (
            <p className="text-muted-foreground text-xs">
              Confirm your password above first — this stays locked until you do.
            </p>
          )}

          {/*
            This one keeps BOTH gates. The typed phrase proves deliberation;
            the dialog states the consequence one last time, in a sentence the
            typed phrase does not contain.
          */}
          <ConfirmButton
            message={`Permanently delete ${objects} from the connected Firefly III? This runs against your ledger and cannot be undone from here.`}
            title="Delete permanently"
            confirmLabel="Delete permanently"
            pendingLabel="Deleting…"
            disabled={!matches}
          >
            Delete permanently
          </ConfirmButton>
        </CardContent>
      </Card>
    </form>
  );
}
