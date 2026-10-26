import { describe, expect, it } from 'vitest';
import { SENTRY_DATA_COLLECTION } from '@/lib/sentry-data-collection';

// SDK 11 collects every one of these by default, so a field dropped from the
// policy is a field switched back on. Each is listed by name rather than by
// iterating the object, so removing one fails here instead of passing.
describe('SENTRY_DATA_COLLECTION', () => {
  it('collects nothing that describes a request or a person', () => {
    expect(SENTRY_DATA_COLLECTION.userInfo).toBe(false);
    expect(SENTRY_DATA_COLLECTION.cookies).toBe(false);
    expect(SENTRY_DATA_COLLECTION.httpHeaders).toBe(false);
    expect(SENTRY_DATA_COLLECTION.httpBodies).toEqual([]);
    expect(SENTRY_DATA_COLLECTION.urlQueryParams).toBe(false);
    expect(SENTRY_DATA_COLLECTION.databaseQueryData).toBe(false);
    expect(SENTRY_DATA_COLLECTION.queues).toBe(false);
    expect(SENTRY_DATA_COLLECTION.stackFrameVariables).toBe(false);
  });

  it('records no payloads from the optional integrations', () => {
    expect(SENTRY_DATA_COLLECTION.graphQL).toEqual({ document: false, variables: false });
    expect(SENTRY_DATA_COLLECTION.genAI).toEqual({ inputs: false, outputs: false });
    expect(SENTRY_DATA_COLLECTION.mcp).toEqual({ inputs: false, outputs: false });
  });
});
