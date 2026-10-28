import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { batchSummary, listBatches, type Batch } from '@/server/import/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { UploadForm } from './upload-form';

export const metadata: Metadata = { title: 'Import transactions' };

const STATUS: Record<
  Batch['status'],
  { label: string; variant: 'secondary' | 'warning' | 'income' | 'outline' }
> = {
  preview: { label: 'Not imported yet', variant: 'secondary' },
  importing: { label: 'Interrupted', variant: 'warning' },
  done: { label: 'Imported', variant: 'income' },
  undone: { label: 'Undone', variant: 'outline' },
};

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const batches = await listBatches();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/transactions"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Transactions
      </Link>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Import transactions</h1>
        <p className="text-muted-foreground text-sm">
          Fill in a spreadsheet, upload it, check the preview, then import. Starting fresh? The
          import sets up your accounts, categories, budgets and tags from the transactions
          themselves, and reuses anything that already exists. Nothing is written until you confirm,
          rows already in your ledger are flagged as duplicates, and a finished import can be
          undone.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Get the template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            One sheet, one row per transaction: date, description, amount, source and destination,
            plus category, budget, tags and notes if you like. Its three sample rows show an income,
            a spend and a transfer; leave them in or delete them, the import skips them. You never
            say what kind of transaction a row is or what kind of account a new name is — the import
            works that out from how money moves through the file.
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="/api/import/template" download>
              <Download className="size-4" aria-hidden="true" />
              Download template (.xlsx)
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Upload it</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm />
        </CardContent>
      </Card>

      {batches.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Recent imports</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {batches.map((batch) => {
                const summary = batchSummary(batch);
                const status = STATUS[batch.status];
                return (
                  <Link
                    key={batch.id}
                    href={`/transactions/import/${batch.id}`}
                    className="hover:bg-accent/40 flex items-center gap-3 px-4 py-3"
                  >
                    <FileSpreadsheet
                      className="text-muted-foreground size-5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{batch.fileName}</span>
                      <span className="text-muted-foreground block text-xs">
                        {formatDate(batch.createdAt, { timezone: session.user.timezone })} ·{' '}
                        {batch.rows.length} rows
                        {summary && batch.status !== 'preview'
                          ? ` · ${summary.imported} imported${summary.duplicates ? `, ${summary.duplicates} duplicates` : ''}${summary.failed ? `, ${summary.failed} failed` : ''}`
                          : ''}
                      </span>
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
