'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'fs:hide-balances';

/**
 * E3-14 — blurs every <Amount> via a root attribute; survives reload.
 *
 * The saved preference (E18-02) is applied server-side by the root layout, so
 * balances are already blurred in the first paint rather than a frame after
 * it. This toggle is the per-session override on top of that: localStorage
 * wins when it has an opinion, and the account default applies when it does
 * not — which is what makes the preference work on a device you have never
 * touched the toggle on.
 */
export function HideBalancesToggle({ defaultHidden = false }: { defaultHidden?: boolean }) {
  const [hidden, setHidden] = React.useState(defaultHidden);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = raw === null ? defaultHidden : raw === '1';
      setHidden(stored);
      document.documentElement.dataset.hideBalances = String(stored);
    } catch {
      // private mode / blocked storage — the toggle still works for this page
    }
  }, [defaultHidden]);

  function toggle() {
    const next = !hidden;
    setHidden(next);
    document.documentElement.dataset.hideBalances = String(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? 'Show balances' : 'Hide balances'}
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      <span className="hidden sm:inline">{hidden ? 'Hidden' : 'Visible'}</span>
    </Button>
  );
}
