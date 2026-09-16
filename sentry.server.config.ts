import * as Sentry from '@sentry/nextjs';

/**
 * E1-10 — server-side error reporting.
 *
 * Entirely opt-in: with no SENTRY_DSN set, `init` is never called and the SDK
 * sends nothing anywhere. A self-hoster who wants no telemetry configures
 * nothing and gets none.
 */
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // We never want request bodies or headers: they carry the Bearer PAT.
    sendDefaultPii: false,
    beforeSend(event) {
      // Belt and braces alongside the Pino redaction list. An exception message
      // can embed a URL with credentials, or a header dump from a fetch failure.
      if (event.request?.headers) delete event.request.headers;
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.data) delete event.request.data;
      return event;
    },
  });
}
