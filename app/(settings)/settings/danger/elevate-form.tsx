'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Lock, LockOpen } from 'lucide-react';
import { elevateSessionAction, type ElevateState } from '@/server/auth/security-actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Confirming…' : 'Confirm password'}
    </Button>
  );
}

/**
 * E23-04 — grant the elevation window the destructive operations require.
 *
 * Kept on this page rather than buried in Settings → Security because it only
 * exists to unlock what is directly below it; sending someone to another screen
 * and back to satisfy a gate is how a confirmation becomes a formality.
 */
export function ElevateForm({ elevated }: { elevated: boolean }) {
  const [state, action] = useActionState<ElevateState, FormData>(elevateSessionAction, {});

  if (elevated || state.ok) {
    return (
      <Card className="border-income/40">
        <CardContent className="flex items-center gap-3 p-5">
          <LockOpen className="text-income size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            Password confirmed. Destructive operations are unlocked for a short while.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <Lock className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Confirm it is you</p>
            <p className="text-muted-foreground text-sm">
              Deleting data needs your password again, even though you are signed in — an open
              session on an unattended screen should not be enough.
            </p>
          </div>
        </div>

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

        <form action={action} className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-56 space-y-1.5">
            <Label htmlFor="elevate-password">Password</Label>
            <Input
              id="elevate-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Submit />
        </form>
      </CardContent>
    </Card>
  );
}
