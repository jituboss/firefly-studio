import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { csrfFailure } from '@/server/auth/csrf';
import { consumeRateLimit } from '@/server/auth/rate-limit';
import { getActiveConnection, FireflyRequestError } from '@/server/firefly/api';
import { createBatch } from '@/server/import/service';
import { readWorkbook, WorkbookError } from '@/server/import/workbook';
import { mapHeaders } from '@/lib/import/columns';
import { readImportRow, type ImportRow } from '@/lib/import/cells';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload a filled-in template. A route rather than a Server Action because an
 * action's body is capped at 1 MB, and a route can refuse an oversized file
 * from its declared size before reading it.
 *
 * Parsing happens here, once; what is stored is the parsed rows, never the
 * file. The workbook is a zip, so the size cap is also what bounds how much a
 * crafted file can make the parser unpack — together with the row cap in
 * `readWorkbook`.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const csrf = csrfFailure(request);
  if (csrf) return csrf;

  const connection = await getActiveConnection();
  if (!connection) return NextResponse.json({ error: 'No Firefly connection' }, { status: 409 });

  const limit = await consumeRateLimit(`import:${session.user.id}`, 30, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  const declared = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  if (declared > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'The file is larger than 5 MB.' }, { status: 413 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'The file is larger than 5 MB.' }, { status: 413 });
  }
  if (!/\.(xlsx|csv)$/i.test(file.name)) {
    return NextResponse.json(
      {
        error: 'Upload an .xlsx workbook (or a .csv). Older .xls files need saving as .xlsx first.',
      },
      { status: 400 },
    );
  }

  try {
    const sheet = await readWorkbook(await file.arrayBuffer(), file.name);
    const headers = mapHeaders(sheet.headers);
    if (headers.missing.length > 0) {
      return NextResponse.json(
        {
          error: `The header row is missing ${headers.missing
            .map((column) => column.header)
            .join(', ')}. Start from the template, or rename your columns to match it.`,
        },
        { status: 400 },
      );
    }
    const rows = sheet.rows
      .map(({ line, cells }) => readImportRow(cells, headers, line))
      .filter((row): row is ImportRow => row !== null);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'The file has a header row but no transactions.' },
        { status: 400 },
      );
    }

    const id = await createBatch(file.name.slice(0, 200), rows);
    return NextResponse.json({ id, ignored: headers.ignored });
  } catch (error) {
    if (error instanceof WorkbookError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof FireflyRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    logger.error({ err: error }, 'Import upload failed');
    return NextResponse.json({ error: 'Could not read that file.' }, { status: 500 });
  }
}
