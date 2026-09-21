'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/input';
import { FormMessage } from '@/components/auth/form-shell';
import { LANDING_PAGES, REGIONAL_FORMATS, THEMES, type AppPreferences } from '@/lib/preferences';
import { savePreferencesAction, type PreferencesState } from '@/server/preferences-actions';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save preferences'}
    </Button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Toggle({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="border-input accent-primary mt-0.5 size-4 rounded border"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-muted-foreground block text-xs">{hint}</span>
      </span>
    </label>
  );
}

export function PreferencesForm({ preferences }: { preferences: AppPreferences }) {
  const [state, action] = useActionState<PreferencesState, FormData>(savePreferencesAction, {});
  const { setTheme } = useTheme();

  // next-themes keeps its own copy in localStorage, and that copy is what
  // applies before first paint. Saving the theme to the database alone would
  // store the right value and leave this device showing the old one until
  // localStorage happened to be cleared, so tell next-themes too.
  function syncTheme(event: React.ChangeEvent<HTMLSelectElement>) {
    setTheme(event.target.value);
  }

  return (
    <form action={action} className="space-y-6">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.saved ? <FormMessage tone="notice">Preferences saved.</FormMessage> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Theme" hint="Applies on every device you sign in on.">
          <Label htmlFor="theme">Theme</Label>
          <Select id="theme" name="theme" defaultValue={preferences.theme} onChange={syncTheme}>
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {theme === 'system' ? 'Match my system' : theme === 'light' ? 'Light' : 'Dark'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Regional format" hint="How dates and chart labels are written.">
          <Label htmlFor="locale">Regional format</Label>
          <Select id="locale" name="locale" defaultValue={preferences.locale}>
            {REGIONAL_FORMATS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Landing page" hint="Where signing in takes you.">
          <Label htmlFor="defaultLandingPage">Open on sign-in</Label>
          <Select
            id="defaultLandingPage"
            name="defaultLandingPage"
            defaultValue={preferences.defaultLandingPage}
          >
            {LANDING_PAGES.map((page) => (
              <option key={page.value} value={page.value}>
                {page.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-3">
        <Toggle
          name="hideBalances"
          defaultChecked={preferences.hideBalances}
          label="Hide balances by default"
          hint="Blurs every amount until you hover it. The toggle in the header still works per session."
        />
        <Toggle
          name="reducedMotion"
          defaultChecked={preferences.reducedMotion}
          label="Reduce motion"
          hint="Turns off transitions and animation. Your system setting already does this — use it to reduce motion on a device that does not."
        />
      </div>

      <SaveButton />
    </form>
  );
}
