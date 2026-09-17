'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'fs:hide-balances';

/** E3-14 — blurs every <Amount> via a root attribute; survives reload. */
export function HideBalancesToggle() {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) === '1';
      setHidden(stored);
      document.documentElement.dataset.hideBalances = String(stored);
    } catch {
      // private mode / blocked storage — the toggle still works for this page
    }
  }, []);

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
