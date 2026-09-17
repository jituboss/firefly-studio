'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpAction, type ActionState } from '@/server/auth/actions';
import { Input, Label } from '@/components/ui/input';
import { FieldError, FormMessage, SubmitButton } from '@/components/auth/form-shell';

const MIN_LENGTH = 12;

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Create account</SubmitButton>;
}

/** A four-segment meter. Deliberately not zxcvbn — see server/auth/password.ts. */
function StrengthMeter({ password }: { password: string }) {
  let score = 0;
  if (password.length >= MIN_LENGTH) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score += 1;

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${
              password.length === 0
                ? 'bg-muted'
                : index < score
                  ? score <= 1
                    ? 'bg-expense'
                    : score <= 2
                      ? 'bg-warning'
                      : 'bg-income'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs" aria-live="polite">
        {password.length === 0 ? `At least ${MIN_LENGTH} characters.` : labels[score]}
      </p>
    </div>
  );
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
          minLength={MIN_LENGTH}
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
