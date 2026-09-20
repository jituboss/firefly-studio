'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/error-state';

/**
 * E1-11 / E21-05 — route-level error boundary.
 *
 * The generic "Something went wrong. Try again." it used to render was the
 * right answer to none of the failures that actually reach it: retrying a
 * revoked token fails identically forever, and retrying a rate limit extends
 * it. `lib/error-taxonomy.ts` decides which of those this is and what to
 * offer instead.
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
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center px-6">
      <ErrorState error={error} digest={error.digest} onRetry={reset} className="w-full" />
    </main>
  );
}
