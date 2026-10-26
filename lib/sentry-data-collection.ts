import type { init } from '@sentry/nextjs';

type DataCollection = NonNullable<NonNullable<Parameters<typeof init>[0]>['dataCollection']>;

/**
 * What the Sentry SDK may attach to an event, shared by the server, edge and
 * browser configs.
 *
 * SDK 11 replaced `sendDefaultPii: false` with this option, and its defaults go
 * the other way: headers, cookies, request and response bodies, query strings,
 * user info and the local variables of every stack frame are all collected
 * unless switched off. Here the headers carry the Firefly Bearer PAT, the
 * bodies carry ledger data and a frame's locals can hold either, so everything
 * that describes a request or a person is off. The `beforeSend` scrub in
 * sentry.server.config.ts stays as a second line behind this.
 *
 * `frameContextLines` is left at its default: it is our own source code, which
 * is what makes a stack trace readable.
 */
export const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
} satisfies DataCollection;
