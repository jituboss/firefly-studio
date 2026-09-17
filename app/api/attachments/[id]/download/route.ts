import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** E16-03 — stream an attachment back through the proxy. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const connection = await getActiveConnection();
  if (!connection) return NextResponse.json({ error: 'No Firefly connection' }, { status: 409 });

  const { id } = await params;

  const upstream = await fetch(`${connection.baseUrl}/api/v1/attachments/${id}/download`, {
    headers: { authorization: `Bearer ${connection.token}` },
    redirect: 'manual',
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Attachment not available' }, { status: 404 });
  }

  // The body is streamed rather than buffered, so a large receipt does not sit
  // in this process's memory.
  return new NextResponse(upstream.body, {
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'content-disposition':
        upstream.headers.get('content-disposition') ?? `attachment; filename="attachment-${id}"`,
      'cache-control': 'private, no-store',
    },
  });
}
