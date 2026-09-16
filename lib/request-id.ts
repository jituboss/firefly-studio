import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';
/** Firefly III echoes this back on most endpoints; we correlate on it. */
export const FIREFLY_TRACE_HEADER = 'x-trace-id';

/** Reuse an upstream request id when a proxy supplied one, else mint a new one. */
export function resolveRequestId(headers: Headers): string {
  const inbound = headers.get(REQUEST_ID_HEADER);
  if (inbound && /^[\w-]{8,128}$/.test(inbound)) return inbound;
  return randomUUID();
}
