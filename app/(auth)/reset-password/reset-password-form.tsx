'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { resetPasswordAction, type ActionState } from '@/server/auth/actions';
import { Input, Label } from '@/components/ui/input';
import { FieldError, FormMessage, SubmitButton } from '@/components/auth/form-shell';

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Update password</SubmitButton>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resetPasswordAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      <Submit />
    </form>
  );
}
