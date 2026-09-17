'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { requestPasswordResetAction, type ActionState } from '@/server/auth/actions';
import { Input, Label } from '@/components/ui/input';
import { FormMessage, SubmitButton } from '@/components/auth/form-shell';

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Send reset link</SubmitButton>;
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(requestPasswordResetAction, {});

  if (state.notice) return <FormMessage tone="notice">{state.notice}</FormMessage>;

  return (
    <form action={action} className="space-y-4">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Submit />
    </form>
  );
}
