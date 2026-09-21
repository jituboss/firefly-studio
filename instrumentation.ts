/**
 * Next.js calls this once per server process, before any request is handled.
 * Validating the environment here means a misconfigured deployment fails at
 * boot with a clear message, rather than on the first request that needs a key.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
    return;
  }
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  await import('./sentry.server.config');

  const { getEnv } = await import('@/lib/env');
  const { logger } = await import('@/lib/logger');
  const { initObservability } = await import('@/server/observability');
  const { installAccessLog } = await import('@/server/observability/access-log');

  const env = getEnv();
  initObservability();

  /*
   * E1-16 — before the first request, because it patches the HTTP server that
   * is about to receive them. `register()` is the only hook Next.js gives that
   * is guaranteed to run at that point.
   */
  installAccessLog();

  logger.info(
    {
      nodeEnv: env.NODE_ENV,
      allowPrivateNetworks: env.FIREFLY_ALLOW_PRIVATE_NETWORKS,
      allowInsecureHttp: env.FIREFLY_ALLOW_INSECURE_HTTP,
      minFireflyVersion: env.MIN_FIREFLY_VERSION,
      cache: env.REDIS_URL ? 'redis' : 'postgres-fallback',
    },
    'Firefly Studio starting',
  );
}

export { captureRequestError as onRequestError } from '@sentry/nextjs';
