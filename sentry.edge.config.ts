import * as Sentry from '@sentry/nextjs';

import { SENTRY_DATA_COLLECTION } from '@/lib/sentry-data-collection';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    dataCollection: SENTRY_DATA_COLLECTION,
  });
}
