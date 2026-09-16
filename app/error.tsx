'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * E1-11 — route-level error boundary.
 *
 * The error taxonomy in E21-05 will replace this generic copy with typed,
 * per-cause recovery affordances (network / auth / rate-limit / Firefly-down).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side reporting hook; wired to Sentry in server/observability.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-expense-muted text-expense flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-prose text-sm">
          The page could not be displayed. This has been logged.
        </p>
        {error.digest ? (
          <p className="text-muted-foreground font-mono text-xs">Reference: {error.digest}</p>
        ) : null}
      </div>
      <Button onClick={reset}>
        <RotateCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </main>
  );
}
