import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Paperclip } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getTransaction } from '@/server/firefly/queries';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TransactionDetailActions } from '@/components/transactions/detail-actions';
import { Attachments, type AttachmentRow } from '@/components/transactions/attachments';
import { fireflyGetSafe } from '@/server/firefly/api';
import type { TransactionSplit } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Transaction' };

/** E5-05 — transaction detail, including every split. */
export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const { id } = await params;

  let group;
  try {
    group = (await getTransaction(id)).data;
  } catch {
    notFound();
  }

  const splits = group.attributes.transactions;
  const first = splits[0];
  if (!first) notFound();

  const attachments = await fireflyGetSafe<{
    data: Array<{
      id: string;
      attributes: { filename: string; size: number; mime: string; attachable_id: string };
    }>;
  }>(`/v1/transactions/${id}/attachments`, { data: [] });

  const attachmentsFor = (journalId: string): AttachmentRow[] =>
    attachments.data
      .filter((row) => String(row.attributes.attachable_id) === String(journalId))
      .map((row) => ({
        id: row.id,
        filename: row.attributes.filename,
        size: row.attributes.size,
        mime: row.attributes.mime,
      }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/transactions"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Transactions
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {group.attributes.group_title ?? first.description}
          </h1>
          <Badge
            variant={
              first.type === 'withdrawal'
                ? 'expense'
                : first.type === 'deposit'
                  ? 'income'
                  : 'transfer'
            }
          >
            {first.type}
          </Badge>
          {splits.length > 1 ? <Badge variant="secondary">{splits.length} splits</Badge> : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {formatDate(first.date.slice(0, 10), { timezone: session.user.timezone, style: 'long' })}
        </p>
      </header>

      <TransactionDetailActions id={id} description={first.description} />

      {splits.map((split, index) => (
        <SplitCard
          key={split.transaction_journal_id}
          split={split}
          index={index}
          showIndex={splits.length > 1}
          timezone={session.user.timezone}
          attachments={attachmentsFor(split.transaction_journal_id)}
        />
      ))}
    </div>
  );
}

function SplitCard({
  split,
  index,
  showIndex,
  timezone,
  attachments,
}: {
  split: TransactionSplit;
  index: number;
  showIndex: boolean;
  timezone: string;
  attachments: AttachmentRow[];
}) {
  const outgoing = split.type === 'withdrawal';

  const fields: Array<[string, React.ReactNode]> = [
    [
      'Flow',
      <span key="flow" className="inline-flex items-center gap-1.5">
        {split.source_name}
        <ArrowRight className="size-3 opacity-50" aria-hidden="true" />
        {split.destination_name}
      </span>,
    ],
    ['Category', split.category_name ?? '—'],
    ['Budget', split.budget_name ?? '—'],
    ['Bill', split.bill_name ?? '—'],
    ['Date', formatDate(split.date.slice(0, 10), { timezone })],
    ['Reconciled', split.reconciled ? 'Yes' : 'No'],
    ['Reference', split.internal_reference ?? '—'],
  ];

  if (split.foreign_amount && split.foreign_currency_code) {
    fields.splice(1, 0, [
      'Foreign amount',
      <Amount
        key="foreign"
        value={split.foreign_amount}
        currency={split.foreign_currency_code}
        size="sm"
        showSign={false}
        tone="neutral"
      />,
    ]);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {showIndex ? (
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Split {index + 1}
              </p>
            ) : null}
            <p className="truncate font-medium">{split.description}</p>
          </div>
          <Amount
            value={outgoing ? `-${split.amount}` : split.amount}
            currency={split.currency_code}
            decimalPlaces={split.currency_decimal_places}
            tone={split.type === 'transfer' ? 'transfer' : 'auto'}
            size="lg"
          />
        </div>

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="truncate">{value}</dd>
            </div>
          ))}
        </dl>

        {split.tags && split.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {split.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {split.notes ? (
          <p className="text-muted-foreground bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">
            {split.notes}
          </p>
        ) : null}

        <div className="space-y-2 border-t pt-4">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <Paperclip className="size-3.5" aria-hidden="true" />
            Attachments
          </p>
          <Attachments journalId={split.transaction_journal_id} initial={attachments} />
        </div>
      </CardContent>
    </Card>
  );
}
