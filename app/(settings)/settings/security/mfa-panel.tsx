'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Copy, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormMessage } from '@/components/auth/form-shell';
import {
  beginMfaAction,
  confirmMfaAction,
  disableMfaAction,
  type MfaState,
} from '@/server/auth/mfa-actions';
import type { MfaStatus } from '@/server/auth/mfa';

function Submit({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive';
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {children}
    </Button>
  );
}

/**
 * E2-06 — the enrolment flow, as three states in one panel: off, mid-enrolment
 * (QR + confirm), and on.
 *
 * The QR is rendered on the server and passed in as a data URI, so the secret
 * is never handed to a client-side QR library and never appears in a network
 * request of its own.
 */
export function MfaPanel({
  status,
  qrFor,
}: {
  status: MfaStatus;
  /** Server action that turns an otpauth URI into an SVG data URI. */
  qrFor: (uri: string) => Promise<string>;
}) {
  const [begin, beginAction] = useActionState<MfaState, FormData>(beginMfaAction, {});
  const [confirm, confirmAction] = useActionState<MfaState, FormData>(confirmMfaAction, {});
  const [disable, disableAction] = useActionState<MfaState, FormData>(disableMfaAction, {});

  const [qr, setQr] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [confirmingOff, setConfirmingOff] = React.useState(false);

  // The enrolment URI only exists after the server action returns, so the QR is
  // fetched once it does rather than rendered eagerly.
  const uri = confirm.uri ?? begin.uri;
  const secret = confirm.secret ?? begin.secret;

  React.useEffect(() => {
    if (!uri) {
      setQr(null);
      return;
    }
    let cancelled = false;
    qrFor(uri).then((value) => {
      if (!cancelled) setQr(value);
    });
    return () => {
      cancelled = true;
    };
  }, [uri, qrFor]);

  // --- just enrolled: show the recovery codes, once ---
  if (confirm.recoveryCodes) {
    return (
      <div className="space-y-3">
        <FormMessage tone="notice">
          Two-factor authentication is on. Save these recovery codes now — they are not shown again.
        </FormMessage>
        <ul className="bg-muted grid grid-cols-2 gap-2 rounded-md p-3 font-mono text-sm">
          {confirm.recoveryCodes.map((code) => (
            <li key={code} className="tabular">
              {code}
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(confirm.recoveryCodes!.join('\n'));
            setCopied(true);
          }}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy all'}
        </Button>
      </div>
    );
  }

  // --- already on ---
  if (status.enrolled) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> On
          </Badge>
          <p className="text-muted-foreground text-xs">
            {status.remainingRecoveryCodes} recovery code
            {status.remainingRecoveryCodes === 1 ? '' : 's'} unused
            {status.lastUsedAt ? ' · last used to sign in' : ''}
          </p>
        </div>

        {disable.error ? <FormMessage tone="error">{disable.error}</FormMessage> : null}
        {disable.notice ? <FormMessage tone="notice">{disable.notice}</FormMessage> : null}

        {confirmingOff ? (
          <form action={disableAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="mfa-off-password">Confirm your password to turn it off</Label>
              <Input
                id="mfa-off-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex gap-2">
              <Submit variant="destructive">Turn off two-factor</Submit>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingOff(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setConfirmingOff(true)}>
            Turn off
          </Button>
        )}
      </div>
    );
  }

  // --- mid-enrolment ---
  if (uri && secret) {
    return (
      <form action={confirmAction} className="space-y-4">
        {confirm.error ? <FormMessage tone="error">{confirm.error}</FormMessage> : null}

        {/* Carried through so a wrong code does not invalidate the QR that was
            just scanned. */}
        <input type="hidden" name="secret" value={secret} />
        <input type="hidden" name="uri" value={uri} />

        <div className="flex flex-wrap items-start gap-4">
          {qr ? (
            /* eslint-disable-next-line @next/next/no-img-element -- a data: URI
               has no remote host for next/image to optimise, and routing it
               through the image optimiser would put the TOTP secret in a URL. */
            <img
              src={qr}
              alt="QR code for enrolling this account in your authenticator app"
              width={160}
              height={160}
              className="rounded-md bg-white p-2"
            />
          ) : (
            <div className="bg-muted size-[160px] animate-pulse rounded-md" />
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm">Scan this with your authenticator app.</p>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Or enter the key by hand:</p>
              <code className="bg-muted block rounded px-2 py-1.5 font-mono text-xs break-all">
                {secret}
              </code>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mfa-code">Enter the code it shows</Label>
          <Input
            id="mfa-code"
            name="code"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="123456"
            className="tabular max-w-[12rem] tracking-[0.2em]"
          />
        </div>

        <Submit>Turn on two-factor</Submit>
      </form>
    );
  }

  // --- off ---
  return (
    <form action={beginAction} className="space-y-3">
      {begin.error ? <FormMessage tone="error">{begin.error}</FormMessage> : null}
      <p className="text-muted-foreground text-sm">
        Add a code from an authenticator app to your sign-in. You will get recovery codes for if you
        lose the device.
      </p>
      <Submit variant="outline">
        <KeyRound className="size-4" aria-hidden="true" />
        Set up two-factor
      </Submit>
    </form>
  );
}
