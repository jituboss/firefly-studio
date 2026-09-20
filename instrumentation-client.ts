/**
 * Client-side error reporting.
 *
 * The import is dynamic and behind the DSN check on purpose. This file used a
 * top-level `import * as Sentry`, which put the whole browser SDK — 56 kB
 * gzipped — into the shared chunk of every route, for every visitor, whether
 * or not Sentry was configured. The `if` only ever gated `init()`; it could not
 * gate the bundle, because a static import is not conditional.
 *
 * `NEXT_PUBLIC_SENTRY_DSN` is inlined at build time, so when it is unset the
 * whole branch is dead code and webpack drops the SDK entirely. When it IS set,
 * the import becomes a separate chunk fetched after hydration rather than part
 * of the critical path. Either way the default self-host — which sets no DSN —
 * stops paying for a dependency it never uses.
 *
 * A DSN is a write-only ingest key rather than a secret, but it is still only
 * present when explicitly configured.
 */
type TransitionHook = (href: string, navigationType: string) => void;

let captureRouterTransitionStart: TransitionHook | undefined;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
    captureRouterTransitionStart = Sentry.captureRouterTransitionStart as TransitionHook;
  });
}

/**
 * Next calls this on every client navigation. It has to exist synchronously
 * even though the SDK behind it may still be loading, so it forwards when
 * there is something to forward to and does nothing when there is not.
 */
export const onRouterTransitionStart: TransitionHook = (href, navigationType) => {
  captureRouterTransitionStart?.(href, navigationType);
};
