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

  const env = getEnv();
  initObservability();

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
