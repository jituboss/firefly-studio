import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

/**
 * E1-10 — observability wiring.
 *
 * Sentry and the OTLP exporter are configured lazily and only when their
 * environment variables are present, so a self-hoster who wants neither pays no
 * startup cost and sends no telemetry anywhere. Nothing here is on by default.
 */

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  connectionId?: string;
  fireflyTraceId?: string;
  [key: string]: unknown;
}

let initialised = false;

export function initObservability(): void {
  if (initialised) return;
  initialised = true;

  logger.info(
    {
      errorReporting: process.env.SENTRY_DSN ? 'sentry' : 'logs-only',
      tracing: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? 'otlp' : 'disabled',
    },
    'Observability configured',
  );
}

/**
 * Report a handled error. Always logs; forwards to Sentry when configured.
 * The logger's redaction list strips anything token-shaped from `context`.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  logger.error({ err: error, ...context }, 'Handled error');

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        requestId: context.requestId,
        fireflyTraceId: context.fireflyTraceId,
      },
      // `user` carries the internal id only — never the email address.
      user: context.userId ? { id: context.userId } : undefined,
      extra: context,
    });
  }
}

/** Attach the Firefly trace id to the active span for cross-system debugging. */
export function annotateTrace(bindings: Record<string, string | undefined>): void {
  if (!process.env.SENTRY_DSN) return;
  const span = Sentry.getActiveSpan();
  if (!span) return;
  for (const [key, value] of Object.entries(bindings)) {
    if (value) span.setAttribute(key, value);
  }
}
