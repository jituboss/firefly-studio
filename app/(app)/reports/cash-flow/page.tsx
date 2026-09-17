import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getExpenseTotal,
  getIncomeTotal,
  getTransactionsInRange,
} from '@/server/firefly/report-queries';
import { resolveReportScope } from '@/lib/report-scope';
import { insightTotal } from '@/lib/reports';
import { buildSankey, type FlowTransaction } from '@/lib/sankey';
import { subtract } from '@/lib/money';
import { SankeyFlow } from '@/components/charts/sankey-flow';
import { ReportSection, ReportStat } from '@/components/reports/report-ui';
import { ReportExportButton } from '@/components/reports/report-export';

export const metadata: Metadata = { title: 'Cash-flow report' };

/**
 * E14-06 — the cash-flow Sankey.
 *
 * Unlike every other report here this one reads raw transactions, because the
 * diagram is about the PAIRING of source and destination and no aggregate
 * endpoint exposes that: `/insight/*` reports one side or the other, never the
 * edge between them.
 */
const FLOW_SAMPLE_LIMIT = 500;

export default async function CashFlowReportPage({
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

  const [transactions, income, expense] = await Promise.all([
    getTransactionsInRange(current, FLOW_SAMPLE_LIMIT),
    getIncomeTotal(current),
    getExpenseTotal(current),
  ]);

  // A Firefly transaction group holds one or more splits, and it is the SPLIT
  // that carries the source, destination and category — so the flows come from
  // flattening the groups, not from the groups themselves.
  const flows: FlowTransaction[] = transactions.data.flatMap((group) =>
    group.attributes.transactions.map((split) => ({
      type: split.type,
      amount: split.amount,
      currency_code: split.currency_code,
      source_name: split.source_name,
      destination_name: split.destination_name,
      category_name: split.category_name,
    })),
  );

  const diagram = buildSankey(flows, scope.currency, { width: 760, height: 440 });

  const earned = insightTotal(income, scope.currency);
  const spent = insightTotal(expense, scope.currency);
  const truncated = (transactions.meta.pagination?.total ?? 0) > FLOW_SAMPLE_LIMIT;

  const exportRows = diagram.links.map((link) => ({
    from: link.source.slice(2),
    to: link.target.slice(2),
    amount: link.value,
    currency: diagram.currency,
  }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat
          label="Income"
          value={earned}
          currency={scope.currency}
          tone="income"
          hint={scope.label}
        />
        <ReportStat
          label="Expenses"
          value={spent}
          currency={scope.currency}
          tone="expense"
          hint={scope.label}
        />
        <ReportStat
          label="Net"
          value={subtract(earned, spent).toString()}
          currency={scope.currency}
          tone="auto"
          hint="Income less expenses"
        />
        <ReportStat
          label="Flows drawn"
          value="0"
          raw={String(diagram.links.length)}
          hint={`${diagram.nodes.length} nodes`}
        />
      </div>

      <ReportSection
        title="Where the money flows"
        description="Income sources on the left, your accounts in the middle, spending on the right. Hover a ribbon for its amount."
        actions={
          <ReportExportButton
            rows={exportRows}
            filename={`cash-flow-${scope.start}-to-${scope.end}`}
          />
        }
      >
        <SankeyFlow diagram={diagram} />

        <div className="text-muted-foreground space-y-1 text-xs">
          <p>
            Transfers between your own accounts are left out: they are not a flow through the
            diagram, and including them would stop the columns adding up.
          </p>
          {diagram.omitted > 0 ? (
            <p>
              Smaller sources and categories are grouped into “Other” to keep the diagram legible.
            </p>
          ) : null}
          {truncated ? (
            <p>
              Drawn from the {FLOW_SAMPLE_LIMIT} most recent transactions in this period, of{' '}
              {transactions.meta.pagination?.total}. Narrow the date range for a complete picture.
            </p>
          ) : null}
        </div>
      </ReportSection>
    </div>
  );
}
