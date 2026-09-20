import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { invalidateTags } from '@/server/firefly/cache';
import { logger } from '@/lib/logger';
import { csrfFailure } from '@/server/auth/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * E16-01 — attachment upload.
 *
 * Firefly takes two calls: create the attachment record, then PUT the bytes to
 * its /upload endpoint. The JSON proxy cannot carry a binary body, so this
 * route owns both steps and streams the file through.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const csrf = csrfFailure(request);
  if (csrf) return csrf;

  const connection = await getActiveConnection();
  if (!connection) return NextResponse.json({ error: 'No Firefly connection' }, { status: 409 });

  const form = await request.formData();
  const file = form.get('file');
  const attachableType = String(form.get('attachable_type') ?? 'TransactionJournal');
  const attachableId = String(form.get('attachable_id') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file supplied' }, { status: 400 });
  }
  if (!attachableId) {
    return NextResponse.json({ error: 'Missing attachable_id' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is larger than 25 MB' }, { status: 413 });
  }

  const headers = {
    accept: 'application/vnd.api+json',
    authorization: `Bearer ${connection.token}`,
  };

  try {
    // Step 1 — create the record.
    const createResponse = await fetch(`${connection.baseUrl}/api/v1/attachments`, {
      method: 'POST',
      redirect: 'manual',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        attachable_type: attachableType,
        attachable_id: attachableId,
        title: file.name,
      }),
    });

    if (!createResponse.ok) {
      const detail = await createResponse.text();
      logger.warn({ status: createResponse.status }, 'Attachment create failed');
      return NextResponse.json(
        {
          error: `Firefly rejected the attachment (${createResponse.status})`,
          detail: detail.slice(0, 400),
        },
        { status: 502 },
      );
    }

    const created = (await createResponse.json()) as { data: { id: string } };

    // Step 2 — upload the bytes.
    const uploadResponse = await fetch(
      `${connection.baseUrl}/api/v1/attachments/${created.data.id}/upload`,
      {
        method: 'POST',
        redirect: 'manual',
        headers: { ...headers, 'content-type': 'application/octet-stream' },
        body: await file.arrayBuffer(),
      },
    );

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { error: `Upload failed (${uploadResponse.status})` },
        { status: 502 },
      );
    }

    await invalidateTags(connection.id, ['transactions']);
    return NextResponse.json({ id: created.data.id, filename: file.name });
  } catch (error) {
    logger.error({ err: error }, 'Attachment upload failed');
    return NextResponse.json({ error: 'Upload failed' }, { status: 502 });
  }
}
