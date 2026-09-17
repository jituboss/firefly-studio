'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpAction, type ActionState } from '@/server/auth/actions';
import { Input, Label } from '@/components/ui/input';
import { FieldError, FormMessage, SubmitButton } from '@/components/auth/form-shell';
import { StrengthMeter } from '@/components/auth/strength-meter';
import { MIN_PASSWORD_LENGTH } from '@/lib/password-strength';

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Create account</SubmitButton>;
}

export function SignUpForm() {
  const [state, action] = useActionState<ActionState, FormData>(signUpAction, {});
  const [password, setPassword] = useState('');

  if (state.notice) {
    return <FormMessage tone="notice">{state.notice}</FormMessage>;
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Name (optional)</Label>
        <Input id="displayName" name="displayName" autoComplete="name" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
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
        <StrengthMeter password={password} />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      <Submit />
    </form>
  );
}
