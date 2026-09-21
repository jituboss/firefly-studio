import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getBillsInRange,
  getExpenseByBill,
  getExpenseWithoutBill,
} from '@/server/firefly/report-queries';
import { resolveReportScope } from '@/lib/report-scope';
import { buildBillReport, buildBreakdown } from '@/lib/reports';
import { divide, toDecimal } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Amount } from '@/components/ui/amount';
import { Table, TBody, TD, TFoot, TH, THead, TR } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ReportSection, ReportStat } from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Subscription report' };

export default async function BillReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const params = await searchParams;
  const scope = resolveReportScope(params, connection.primaryCurrency, session.user.timezone);
  const current = { start: scope.start, end: scope.end, accounts: scope.accounts };

  const [bills, actuals, unbilled] = await Promise.all([
    getBillsInRange(current),
    getExpenseByBill(current),
    getExpenseWithoutBill(current),
  ]);

  const report = buildBillReport(bills.data, actuals, scope.currency);
  const unbilledTotal = buildBreakdown(unbilled, scope.currency).total;
  const monthly = divide(report.totalAnnualised, 12).toString();

  const exportRows = report.rows.map((row) => ({
    subscription: row.name,
    expected: row.expected,
    frequency: row.repeatFreq,
    annualised: row.annualised,
    paid_in_period: row.actual,
    active: row.active ? 'yes' : 'no',
    currency: report.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Annualised cost"
          value={report.totalAnnualised}
          currency={report.currency}
          tone="expense"
          hint="Active subscriptions only"
        />
        <ReportStat
          label="Per month"
          value={monthly}
          currency={report.currency}
          tone="expense"
          hint="Annualised, spread evenly"
        />
        <ReportStat
          label="Paid this period"
          value={report.totalActual}
          currency={report.currency}
          tone="expense"
          hint={scope.label}
        />
        <ReportStat
          label="Subscriptions"
          value="0"
          raw={String(report.activeCount)}
          hint={
            report.inactiveCount > 0
              ? `${report.inactiveCount} inactive, not counted`
              : 'All active'
          }
        />
      </div>

      <ReportSection
        title="Recurring cost"
        description="Firefly stores a subscription as a min/max band; the expected figure is its midpoint."
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`subscriptions-${scope.start}-to-${scope.end}`}
          />
        }
      >
        {report.rows.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No subscriptions in {report.currency}.{' '}
            <Link
              href="/bills/new"
              className="hover:text-primary hover:underline"
              data-print="hide"
            >
              Add one →
            </Link>
          </p>
        ) : (
          <Table label="Subscriptions" cards>
            <THead>
              <TR head>
                <TH>Subscription</TH>
                <TH align="right">Expected</TH>
                <TH hideBelow="sm">Every</TH>
                <TH align="right">Per year</TH>
                <TH align="right">Paid</TH>
              </TR>
            </THead>
            <TBody>
              {report.rows.map((row) => (
                <TR key={row.id} className={cn(!row.active && 'opacity-55')}>
                  <TD className="max-w-[14rem]">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        href={`/bills/${row.id}`}
                        className="hover:text-primary truncate hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.active ? null : (
                        <Badge variant="secondary" className="shrink-0">
                          inactive
                        </Badge>
                      )}
                    </div>
                    {row.nextExpected ? (
                      <p className="text-muted-foreground text-xs">
                        next {formatDate(row.nextExpected, { timezone: session.user.timezone })}
                      </p>
                    ) : null}
                  </TD>
                  <TD label="Expected" align="right">
                    <Amount
                      value={row.expected}
                      currency={report.currency}
                      showSign={false}
                      tone="neutral"
                    />
                  </TD>
                  <TD label="Every" hideBelow="sm" className="text-muted-foreground">
                    {row.repeatFreq}
                  </TD>
                  <TD label="Per year" align="right">
                    {toDecimal(row.annualised).isZero() ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <Amount
                        value={row.annualised}
                        currency={report.currency}
                        showSign={false}
                        tone="expense"
                      />
                    )}
                  </TD>
                  <TD label="Paid" align="right">
                    <Amount
                      value={row.actual}
                      currency={report.currency}
                      showSign={false}
                      tone="neutral"
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
            <TFoot>
              <TR>
                <TD>Total</TD>
                <TD label="Expected" />
                <TD label="Every" hideBelow="sm" />
                <TD label="Per year" align="right">
                  <Amount
                    value={report.totalAnnualised}
                    currency={report.currency}
                    showSign={false}
                    tone="expense"
                  />
                </TD>
                <TD label="Paid" align="right">
                  <Amount
                    value={report.totalActual}
                    currency={report.currency}
                    showSign={false}
                    tone="neutral"
                  />
                </TD>
              </TR>
            </TFoot>
          </Table>
        )}
        <p className="text-muted-foreground text-xs">
          A frequency Firefly does not recognise annualises to —, so it is left out of the total
          rather than guessed at.
        </p>
      </ReportSection>

      <ReportSection
        title="Spending outside subscriptions"
        description="Everything in this period not matched to a subscription."
      >
        <div className="flex items-baseline gap-2">
          <Amount
            value={unbilledTotal}
            currency={scope.currency}
            showSign={false}
            tone="expense"
            size="lg"
          />
          <span className="text-muted-foreground text-xs">{scope.label}</span>
        </div>
      </ReportSection>
    </div>
  );
}
