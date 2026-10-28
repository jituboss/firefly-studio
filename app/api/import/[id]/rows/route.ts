import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { currentPlan, getBatch } from '@/server/import/service';
import { buildRowsWorkbook } from '@/server/import/workbook';
import type { ImportRow } from '@/lib/import/cells';
import { KIND_LABELS } from '@/lib/account-matrix';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function values(row: ImportRow) {
  return {
    date: row.date,
    amount: row.amount,
    description: row.description,
    source: row.source,
    destination: row.destination,
    type: row.type,
    source_kind: row.sourceKind ? KIND_LABELS[row.sourceKind].toLowerCase() : null,
    destination_kind: row.destinationKind ? KIND_LABELS[row.destinationKind].toLowerCase() : null,
    currency: row.currency,
    foreign_amount: row.foreignAmount,
    foreign_currency: row.foreignCurrency,
    category: row.category,
    budget: row.budget,
    tags: row.tags.join(', '),
    notes: row.notes,
    external_ref: row.externalRef,
  };
}

/**
 * The rows that will not (or did not) import, as a workbook to fix and upload
 * again. Re-uploading is safe because the rows that DID import are recognised
 * as duplicates of themselves.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const { id } = await params;
  const batch = await getBatch(id);
  if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let rows: Array<{ values: ReturnType<typeof values>; error: string }>;
  if (batch.committed) {
    rows = batch.committed.rows
      .filter((row) => batch.results[String(row.line)]?.status === 'failed')
      .map((row) => ({
        values: values(row.row),
        error: batch.results[String(row.line)]?.error ?? 'Failed',
      }));
  } else {
    const plan = await currentPlan(batch);
    rows = plan.rows
      .filter((row) => row.status === 'error')
      .map((row) => ({ values: values(row.row), error: row.errors.join(' ') }));
  }

  const name = batch.fileName.replace(/\.(xlsx|csv)$/i, '').replace(/[^\w.-]+/g, '-');
  const which = request.nextUrl.searchParams.get('which') === 'failed' ? 'failed' : 'errors';
  const file = await buildRowsWorkbook(rows);
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${name}-${which}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
