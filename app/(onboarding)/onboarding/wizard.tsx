'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, ExternalLink, Flame, ShieldCheck } from 'lucide-react';
import {
  completeOnboardingAction,
  connectManagedAction,
  connectTokenAction,
  probeBaseUrlAction,
  type ManagedState,
  type ProbeState,
  type TokenState,
} from '@/server/onboarding/actions';
import { signOutAction } from '@/server/auth/actions';
import { Input, Label } from '@/components/ui/input';
import { FormMessage, SubmitButton } from '@/components/auth/form-shell';

interface AssetAccount {
  id: string;
  name: string;
  type: string;
  currencyCode: string | null;
}

const STEPS = ['Server', 'Token', 'Preferences'] as const;

function Submit({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>{children}</SubmitButton>;
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Onboarding progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                done
                  ? 'bg-income text-income-foreground'
                  : active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : step}
            </span>
            <span
              className={`hidden text-sm sm:inline ${active ? 'font-medium' : 'text-muted-foreground'}`}
            >
              {label}
            </span>
            {index < STEPS.length - 1 ? <span className="bg-border h-px flex-1" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingWizard(props: {
  /** E2-23 — true when attaching an extra instance rather than first-run setup. */
  adding?: boolean;
  initialStep: 1 | 2 | 3;
  initialBaseUrl: string;
  connectionLabel: string | null;
  remoteEmail: string | null;
  fireflyVersion: string | null;
  currency: string | null;
  accounts: AssetAccount[];
  timezone: string;
  /** Shown in the footer so it is obvious which account is being set up. */
  email: string;
  /** Null unless this deployment operates a Firefly instance of its own. */
  managed: { label: string; hasAccount: boolean } | null;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(props.initialStep);

  const [probeState, probeAction] = useActionState<ProbeState, FormData>(probeBaseUrlAction, {
    baseUrl: props.initialBaseUrl,
  });
  const [tokenState, tokenAction] = useActionState<TokenState, FormData>(connectTokenAction, {});
  const [managedState, managedAction] = useActionState<ManagedState, FormData>(
    connectManagedAction,
    {},
  );

  // The server actions are the source of truth; these advance the view once
  // they report success. Reloading re-derives the step from the database.
  if (probeState.ok && step === 1) setStep(2);
  if (tokenState.ok && step === 2) setStep(3);
  // The managed path mints its own token, so it jumps straight past step 2.
  if (managedState.ok && step === 1) setStep(3);

  return (
    <main id="main" className="bg-background min-h-svh px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Flame className="text-primary size-5" aria-hidden="true" />
          <span className="font-semibold tracking-tight">Firefly Studio</span>
        </div>

        {props.adding ? (
          <div className="bg-muted mb-6 rounded-md px-3 py-2 text-sm">
            Adding another Firefly instance. Your existing connection stays active until you switch
            to this one.
          </div>
        ) : null}

        <Stepper current={step} />

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          {step === 1 && props.managed ? (
            <div className="mb-6 space-y-4">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">
                  Where should your money live?
                </h1>
                <p className="text-muted-foreground text-sm">
                  Use the Firefly III this app runs for you, or point it at one of your own.
                </p>
              </div>

              {managedState.error ? (
                <FormMessage tone="error">{managedState.error}</FormMessage>
              ) : null}

              <form action={managedAction}>
                <div className="border-primary/40 bg-primary/5 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      className="text-primary mt-0.5 size-5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium">{props.managed.label}</p>
                      <p className="text-muted-foreground text-sm">
                        {props.managed.hasAccount
                          ? 'You already have a ledger here. Reconnecting puts you back into it — nothing is lost.'
                          : 'We create your account and set up access for you. No token to find, nothing to install.'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Submit>
                      {props.managed.hasAccount ? 'Reconnect my ledger' : 'Use this one'}
                    </Submit>
                  </div>
                </div>
              </form>

              <div className="flex items-center gap-3">
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs">or connect your own</span>
                <span className="bg-border h-px flex-1" />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <form action={probeAction} className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">Where is your Firefly III?</h1>
                <p className="text-muted-foreground text-sm">
                  The address you use to open Firefly III in your browser. We will check that it is
                  reachable before going further.
                </p>
              </div>

              {probeState.error ? <FormMessage tone="error">{probeState.error}</FormMessage> : null}

              <div className="space-y-1.5">
                <Label htmlFor="baseUrl">Server address</Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  required
                  inputMode="url"
                  placeholder="https://firefly.example.com"
                  defaultValue={probeState.baseUrl ?? props.initialBaseUrl}
                />
                <p className="text-muted-foreground text-xs">
                  A trailing <code className="font-mono">/api/v1</code> is removed automatically.
                </p>
              </div>

              <Submit>Check connection</Submit>
            </form>
          ) : null}

          {step === 2 ? (
            <form action={tokenAction} className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">
                  Add a Personal Access Token
                </h1>
                <p className="text-muted-foreground text-sm">
                  Found a Firefly III API at{' '}
                  <span className="font-mono text-xs">{probeState.baseUrl}</span>. It needs a token
                  before it will tell us anything else.
                </p>
              </div>

              {tokenState.error ? <FormMessage tone="error">{tokenState.error}</FormMessage> : null}

              <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
                <li>
                  In Firefly III open <strong>Options → Profile → OAuth</strong>
                </li>
                <li>
                  Under <strong>Personal Access Tokens</strong>, choose{' '}
                  <strong>Create new token</strong>
                </li>
                <li>Name it &ldquo;Firefly Studio&rdquo; and copy the token that appears once</li>
              </ol>

              {probeState.baseUrl ? (
                <a
                  href={`${probeState.baseUrl}/profile`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
                >
                  Open your Firefly III profile
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="label">Connection name</Label>
                <Input id="label" name="label" defaultValue="My Firefly III" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="token">Personal Access Token</Label>
                <textarea
                  id="token"
                  name="token"
                  required
                  rows={4}
                  autoComplete="off"
                  spellCheck={false}
                  className="border-input bg-background focus-visible:outline-ring w-full rounded-md border p-3 font-mono text-xs break-all focus-visible:outline-2 focus-visible:outline-offset-2"
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6…"
                />
                <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Encrypted with AES-256-GCM before it is stored. It is never sent to your browser
                  again — you will only ever see the last four characters.
                </p>
              </div>

              <Submit>Connect</Submit>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-muted-foreground w-full text-center text-sm underline underline-offset-4"
              >
                Use a different server
              </button>
            </form>
          ) : null}

          {step === 3 ? (
            <form action={completeOnboardingAction} className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">Set your preferences</h1>
                <p className="text-muted-foreground text-sm">
                  {props.remoteEmail
                    ? `Connected as ${props.remoteEmail}${props.fireflyVersion ? ` on Firefly III ${props.fireflyVersion}` : ''}.`
                    : 'Connected.'}
                </p>

                {tokenState.versionWarning ? (
                  <p className="bg-warning-muted text-warning-foreground rounded-md px-3 py-2 text-sm">
                    {tokenState.versionWarning}
                  </p>
                ) : null}
              </div>

              <input type="hidden" name="timezone" value={props.timezone} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="numberFormat">Number format</Label>
                  <select
                    id="numberFormat"
                    name="numberFormat"
                    defaultValue="en-US"
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="en-US">1,234.56</option>
                    <option value="de-DE">1.234,56</option>
                    <option value="fr-FR">1 234,56</option>
                    <option value="en-GB">1,234.56 (UK)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weekStart">Week starts on</Label>
                  <select
                    id="weekStart"
                    name="weekStart"
                    defaultValue="1"
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="1">Monday</option>
                    <option value="0">Sunday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateFormat">Date format</Label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  defaultValue="medium"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="short">15/03/2026</option>
                  <option value="medium">15 Mar 2026</option>
                  <option value="long">15 March 2026</option>
                </select>
              </div>

              {props.accounts.length > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Featured accounts{' '}
                    <span className="text-muted-foreground font-normal">
                      — shown first on your dashboard
                    </span>
                  </legend>
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                    {props.accounts.map((account) => (
                      <label
                        key={account.id}
                        className="hover:bg-accent flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="accountIds"
                          value={account.id}
                          defaultChecked
                          className="size-4"
                        />
                        <span className="flex-1">{account.name}</span>
                        {account.currencyCode ? (
                          <span className="text-muted-foreground text-xs">
                            {account.currencyCode}
                          </span>
                        ) : null}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <p className="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm">
                  No asset accounts found yet. You can add them in Firefly III and pick favourites
                  later in Settings.
                </p>
              )}

              <Submit>Finish setup</Submit>
            </form>
          ) : null}
        </div>

        {/*
          Onboarding is the one authenticated area with no app shell, so it had
          no way out: a user who signed in to the wrong account, or who does not
          have a token to hand yet, was stuck on this screen. Their work is
          saved either way — the wizard re-derives its step from the database on
          the next sign-in.
        */}
        <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm">
          <span className="truncate">Signed in as {props.email}</span>
          <span aria-hidden="true">·</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
