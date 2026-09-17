import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { getActiveConnection, isGuardedPath, isKnownPath } from '@/server/firefly/api';
import { callFirefly, FireflyRequestError } from '@/server/firefly/client';
import { invalidateTags, tagsForPath } from '@/server/firefly/cache';
import { consumeRateLimit } from '@/server/auth/rate-limit';
import { recordAudit } from '@/server/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * §4.3 — the Firefly proxy.
 *
 * Everything the browser needs from Firefly comes through here. The PAT is
 * decrypted per request and never serialised into a response.
 */

async function handle(request: NextRequest, method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const url = new URL(request.url);
  const suffix = url.pathname.replace(/^\/api\/ff/, '');
  const path = `${suffix}${url.search}`;
  const pathForMatch = suffix;

  if (!isKnownPath(method, pathForMatch)) {
    return NextResponse.json({ error: 'Unknown Firefly endpoint' }, { status: 404 });
  }

  if (isGuardedPath(method, pathForMatch)) {
    // Destructive and admin-only operations need an explicit step-up (E23-04).
    if (!session.isElevated) {
      return NextResponse.json(
        { error: 'This operation requires re-authentication.' },
        { status: 403 },
      );
    }
    await recordAudit({
      userId: session.user.id,
      action: 'proxy.guarded_call',
      entity: 'firefly',
      metadata: { method, path: pathForMatch },
    });
  }

  const limit = await consumeRateLimit(`proxy:${session.user.id}`, 600, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    );
  }

  const connection = await getActiveConnection();
  if (!connection) {
    return NextResponse.json({ error: 'No Firefly connection' }, { status: 409 });
  }

  let body: unknown;
  if (method !== 'GET' && method !== 'DELETE') {
    try {
      body = await request.json();
    } catch {
      body = undefined;
    }
  }

  try {
    const result = await callFirefly<unknown>({
      baseUrl: connection.baseUrl,
      token: connection.token,
      path,
      method,
      body,
    });

    if (method !== 'GET') {
      const tags = tagsForPath(pathForMatch);
      if (tags.includes('transactions') || tags.includes('accounts')) {
        tags.push('summary', 'insight', 'charts');
      }
      await invalidateTags(connection.id, tags);
    }

    // Firefly answers DELETE with 204 and an empty body, which callFirefly
    // surfaces as undefined. NextResponse.json(undefined) throws, so return a
    // real no-content response instead.
    if (result === undefined) {
      return new NextResponse(null, { status: 204, headers: { 'cache-control': 'no-store' } });
    }

    return NextResponse.json(result, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    if (error instanceof FireflyRequestError) {
      const status =
        error.code === 'unauthorised'
          ? 401
          : error.code === 'not_firefly'
            ? 502
            : (error.status ?? 502);
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}

export const GET = (request: NextRequest) => handle(request, 'GET');
export const POST = (request: NextRequest) => handle(request, 'POST');
export const PUT = (request: NextRequest) => handle(request, 'PUT');
export const DELETE = (request: NextRequest) => handle(request, 'DELETE');
