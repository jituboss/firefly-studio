import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Paperclip } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getTransaction } from '@/server/firefly/queries';
import { formatDate } from '@/lib/date';
import { add, toDecimal } from '@/lib/money';
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

  // A split group's headline figure is the sum of its legs, which all share a
  // currency in Firefly's own editor. If one ever does not, fall back to the
  // first leg rather than adding two currencies together.
  const sameCurrency = splits.every((split) => split.currency_code === first.currency_code);
  const groupTotal = sameCurrency
    ? splits.reduce((sum, split) => add(sum, split.amount), toDecimal(0)).toString()
    : first.amount;

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
            {first.type.charAt(0).toUpperCase() + first.type.slice(1)}
          </Badge>
          {splits.length > 1 ? <Badge variant="secondary">{splits.length} splits</Badge> : null}
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-muted-foreground text-sm">
            {formatDate(first.date.slice(0, 10), {
              timezone: session.user.timezone,
              style: 'long',
            })}
          </p>
          <Amount
            value={first.type === 'withdrawal' ? `-${groupTotal}` : groupTotal}
            currency={first.currency_code}
            decimalPlaces={first.currency_decimal_places}
            tone={first.type === 'transfer' ? 'transfer' : 'auto'}
            size="xl"
          />
        </div>
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

/** Accounts on a transaction are navigable; a bare name is a dead end. */
function AccountRef({ id, name }: { id: string | null; name: string | null }) {
  if (!name) return <span className="text-muted-foreground">—</span>;
  if (!id) return <span className="truncate">{name}</span>;
  return (
    <Link href={`/accounts/${id}`} className="truncate hover:underline">
      {name}
    </Link>
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

  // Only fields that carry something. Seven rows of em-dashes told the reader
  // nothing except that the layout had seven rows.
  const fields: Array<[string, React.ReactNode]> = [
    [
      'Flow',
      <span key="flow" className="inline-flex min-w-0 items-center gap-1.5">
        <AccountRef id={split.source_id} name={split.source_name} />
        <ArrowRight className="size-3 shrink-0 opacity-50" aria-hidden="true" />
        <AccountRef id={split.destination_id} name={split.destination_name} />
      </span>,
    ],
    ['Date', formatDate(split.date.slice(0, 10), { timezone })],
  ];

  if (split.category_name) fields.push(['Category', split.category_name]);
  if (split.budget_name) fields.push(['Budget', split.budget_name]);
  if (split.bill_name) fields.push(['Bill', split.bill_name]);
  if (split.internal_reference) fields.push(['Reference', split.internal_reference]);
  if (split.external_url)
    fields.push([
      'Link',
      <a
        key="external"
        href={split.external_url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-primary truncate underline underline-offset-2"
      >
        {split.external_url}
      </a>,
    ]);

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
            {split.reconciled ? (
              <Badge variant="outline" className="mt-1">
                Reconciled
              </Badge>
            ) : null}
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
