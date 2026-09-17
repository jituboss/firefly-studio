import * as React from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toDecimal } from '@/lib/money';
import type { Delta, ReportRow } from '@/lib/reports';
import { Card, CardContent } from '@/components/ui/card';
import { Amount } from '@/components/ui/amount';

/**
 * E14 — the presentational vocabulary every report is built from.
 *
 * Server components throughout: a report is a read, so none of this needs to
 * ship JavaScript to the browser. The charts are the only client pieces.
 */

export function ReportSection({
  title,
  description,
  actions,
  children,
  breakBefore,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Start a new sheet here when printed. */
  breakBefore?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn('min-w-0 overflow-hidden', className)}
      data-print={breakBefore ? 'break-before' : undefined}
    >
      <CardContent className="min-w-0 space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-sm font-medium">{title}</h2>
            {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function ReportStat({
  label,
  value,
  currency,
  tone = 'auto',
  change,
  hint,
  /** Render a bare number (a percentage, a count) rather than money. */
  raw,
}: {
  label: string;
  value: string;
  currency?: string;
  tone?: 'auto' | 'neutral' | 'income' | 'expense' | 'transfer';
  change?: Delta | null;
  hint?: string;
  raw?: string;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 p-4 sm:p-5">
        <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <div className="mt-1.5 min-w-0">
          {raw !== undefined ? (
            <span className="tabular block truncate text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
              {raw}
            </span>
          ) : (
            <Amount
              value={value}
              currency={currency}
              tone={tone}
              size="xl"
              showSign={false}
              compact
              className="block truncate"
            />
          )}
        </div>
        {change ? (
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {change.percent === null ? (
              <span>no prior figure</span>
            ) : (
              <span
                className={cn(
                  toDecimal(change.absolute).isNegative() ? 'text-expense' : 'text-income',
                )}
              >
                {toDecimal(change.absolute).isNegative() ? '↓' : '↑'}{' '}
                {Math.abs(change.percent).toFixed(1)}%
              </span>
            )}{' '}
            vs. previous period
          </p>
        ) : hint ? (
          <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * A ranked breakdown with an inline share bar. Every row links through to the
 * transactions behind it (E14-12) when the caller can build such a link.
 */
export function BreakdownTable({
  rows,
  currency,
  total,
  hrefFor,
  emptyMessage = 'Nothing to report for this period.',
  valueLabel = 'Amount',
  nameLabel = 'Name',
}: {
  rows: ReportRow[];
  currency: string;
  total?: string;
  hrefFor?: (row: ReportRow) => string | null;
  emptyMessage?: string;
  valueLabel?: string;
  nameLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-0 text-sm">
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left text-xs">
            <th scope="col" className="py-1.5 pr-3 font-medium">
              {nameLabel}
            </th>
            <th scope="col" className="hidden py-1.5 pr-3 font-medium sm:table-cell">
              Share
            </th>
            <th scope="col" className="py-1.5 text-right font-medium">
              {valueLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const href = hrefFor?.(row) ?? null;
            const name = href ? (
              <Link href={href} className="hover:text-primary truncate hover:underline">
                {row.name}
              </Link>
            ) : (
              <span className="truncate">{row.name}</span>
            );

            return (
              <tr key={row.id ?? `${row.name}-${index}`} className="border-border/60 border-b">
                <td className="max-w-[16rem] py-2 pr-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: `var(--chart-${(index % 8) + 1})` }}
                    />
                    <div className="min-w-0 flex-1 truncate">{name}</div>
                  </div>
                </td>
                <td className="hidden w-40 py-2 pr-3 sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, row.percent)}%`,
                          background: `var(--chart-${(index % 8) + 1})`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground tabular w-10 text-right text-xs">
                      {row.percent.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="py-2 text-right">
                  <Amount value={row.amount} currency={currency} showSign={false} tone="neutral" />
                </td>
              </tr>
            );
          })}
        </tbody>
        {total ? (
          <tfoot>
            <tr className="font-medium">
              <td className="py-2 pr-3">Total</td>
              <td className="hidden sm:table-cell" />
              <td className="py-2 text-right">
                <Amount value={total} currency={currency} showSign={false} tone="neutral" />
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

/**
 * Disclose currencies the report could not include rather than silently
 * under-reporting. Same rule as the dashboard's balance chart: figures across
 * currencies are never summed without conversion data, and Firefly's
 * `pc_entries` come back empty (see lib/balance-trend.ts).
 */
export function CurrencyNotice({
  currency,
  otherCurrencies,
}: {
  currency: string;
  otherCurrencies: string[];
}) {
  if (otherCurrencies.length === 0) return null;
  return (
    <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Reported in {currency}. Amounts in {otherCurrencies.join(', ')} are excluded — Firefly
        supplies no conversion rate here, and summing across currencies would invent a figure.
      </span>
    </p>
  );
}

export function EmptyReport({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-10">
        <p className="text-muted-foreground text-center text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
