'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ShieldCheck } from 'lucide-react';
import { connectManagedAction, type ManagedState } from '@/server/onboarding/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormMessage } from '@/components/auth/form-shell';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Connecting…' : label}
    </Button>
  );
}

/**
 * The managed instance, offered from settings as well as onboarding.
 *
 * `connected` only means a connection currently points at the managed
 * instance. `hasAccount` is the durable fact: the user has a ledger there,
 * whether or not they are using it right now. Reconnecting after a spell on
 * their own instance returns them to that same ledger.
 */
export function ManagedCard({
  label,
  hasAccount,
  connected,
}: {
  label: string;
  hasAccount: boolean;
  connected: boolean;
}) {
  const [state, action] = useActionState<ManagedState, FormData>(connectManagedAction, {});

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-muted-foreground text-sm">
              {connected
                ? 'You are using the ledger this app runs for you.'
                : hasAccount
                  ? 'You have a ledger here from before. Reconnecting puts you back into it, exactly as you left it.'
                  : 'Let this app run a Firefly III ledger for you. It creates the account and sets up access — there is no token to find.'}
            </p>
          </div>
        </div>

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        {state.ok ? <FormMessage tone="notice">Connected.</FormMessage> : null}

        {connected ? null : (
          <form action={action}>
            <Submit label={hasAccount ? 'Reconnect my ledger' : 'Set one up for me'} />
          </form>
        )}
      </CardContent>
    </Card>
  );
}
