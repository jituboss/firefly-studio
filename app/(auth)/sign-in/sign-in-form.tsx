'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, type ActionState } from '@/server/auth/actions';
import { Input, Label } from '@/components/ui/input';
import { FormMessage, SubmitButton } from '@/components/auth/form-shell';

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Sign in</SubmitButton>;
}

export function SignInForm() {
  const [state, action] = useActionState<ActionState, FormData>(signInAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-muted-foreground text-xs underline underline-offset-4"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <Submit />
    </form>
  );
}
