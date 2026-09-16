import * as Sentry from '@sentry/nextjs';

/**
 * Client-side error reporting. Uses the NEXT_PUBLIC_ DSN, which is inlined into
 * the browser bundle — a DSN is a write-only ingest key, not a secret, but it
 * is still only present when explicitly configured.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
