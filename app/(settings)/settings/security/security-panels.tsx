'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { FormMessage } from '@/components/auth/form-shell';
import {
  deleteAccountAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
  type SecurityState,
} from '@/server/auth/security-actions';

function SubmitButton({
  children,
  variant = 'outline',
  size = 'sm',
  label,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'icon' | 'default';
  label?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} aria-label={label}>
      {children}
    </Button>
  );
}

/** E2-08 — revoke a single device. */
export function RevokeSessionButton({ sessionId, device }: { sessionId: string; device: string }) {
  const [state, action] = useActionState<SecurityState, FormData>(revokeSessionAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <SubmitButton variant="ghost" size="sm" label={`Sign out ${device}`}>
        <LogOut className="size-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Sign out</span>
      </SubmitButton>
      {state.error ? <p className="text-expense mt-1 text-xs">{state.error}</p> : null}
    </form>
  );
}

/** E2-08 — revoke everything except this device. */
export function RevokeOthersButton({ otherCount }: { otherCount: number }) {
  const [state, action] = useActionState<SecurityState, FormData>(revokeOtherSessionsAction, {});

  return (
    <div className="space-y-2">
      <form action={action}>
        <SubmitButton variant="outline" size="sm">
          Sign out all other devices
          {otherCount > 0 ? ` (${otherCount})` : ''}
        </SubmitButton>
      </form>
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.notice ? <FormMessage tone="notice">{state.notice}</FormMessage> : null}
    </div>
  );
}

/**
 * E2-10 — the danger zone.
 *
 * Two independent confirmations: the current password (a stolen open session
 * should not be enough) and typing DELETE (a mis-click should not be enough).
 * Collapsed by default so it is never one stray click from the rest of the
 * page.
 */
export function DeleteAccountPanel({ email }: { email: string }) {
  const [state, action] = useActionState<SecurityState, FormData>(deleteAccountAction, {});
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <ShieldAlert className="size-4" aria-hidden="true" />
        Delete my account
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="bg-expense-muted text-expense space-y-1 rounded-md p-3 text-sm">
        <p className="font-medium">This cannot be undone.</p>
        <p>
          Deleting <strong>{email}</strong> removes your Firefly Studio account, its saved views and
          reports, every stored connection and its encrypted token, and clears the cached Firefly
          responses.
        </p>
        <p>
          Your data inside Firefly III itself is <strong>not</strong> touched — this app never
          deletes from your ledger.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="delete-password">Your password</Label>
        <Input
          id="delete-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="delete-confirm">
          Type <span className="font-mono">DELETE</span> to confirm
        </Label>
        <Input id="delete-confirm" name="confirm" required autoComplete="off" pattern="DELETE" />
      </div>

      <div className="flex gap-2">
        <SubmitButton variant="destructive" size="sm">
          Permanently delete my account
        </SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
