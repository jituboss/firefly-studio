'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { verifyMfaAction, type MfaState } from '@/server/auth/mfa-actions';
import { Input, Label } from '@/components/ui/input';
import { FormMessage, SubmitButton } from '@/components/auth/form-shell';

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Verify</SubmitButton>;
}

export function VerifyMfaForm() {
  const [state, action] = useActionState<MfaState, FormData>(verifyMfaAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="space-y-1.5">
        <Label htmlFor="code">Six-digit code</Label>
        <Input
          id="code"
          name="code"
          required
          autoFocus
          // `one-time-code` is what lets iOS and Android offer the code from
          // the notification instead of making the user switch apps.
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="123456"
          className="tabular text-center text-lg tracking-[0.3em]"
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Lost your device? Enter one of your recovery codes instead — each works once.
      </p>

      <Submit />
    </form>
  );
}
