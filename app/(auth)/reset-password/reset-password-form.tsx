'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { resetPasswordAction, type ActionState } from '@/server/auth/actions';
import { Input, Label } from '@/components/ui/input';
import { FieldError, FormMessage, SubmitButton } from '@/components/auth/form-shell';
import { StrengthMeter } from '@/components/auth/strength-meter';
import { MIN_PASSWORD_LENGTH } from '@/lib/password-strength';

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Update password</SubmitButton>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resetPasswordAction, {});
  const [password, setPassword] = useState('');

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
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        {/* The reset form enforces the same rules as sign-up, so it should
            preview them the same way rather than only failing after submit. */}
        <StrengthMeter password={password} />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      <Submit />
    </form>
  );
}
