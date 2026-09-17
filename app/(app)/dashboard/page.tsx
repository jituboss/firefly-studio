import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getAccountsSafe,
  getBalanceChart,
  getBasicSummary,
  getBills,
  getExpenseByCategory,
  getPiggyBanks,
  getTransactions,
} from '@/server/firefly/queries';
import { previousPeriod, resolveRangeFromParams } from '@/lib/date-range';
import { toDecimal } from '@/lib/money';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { AreaTrend, type TrendPoint } from '@/components/charts/area-trend';
import { CategoryBars } from '@/components/charts/category-bars';
import {
  AccountBalanceList,
  KpiTile,
  PiggyProgress,
  RecentTransactions,
  UpcomingBills,
  WidgetCard,
} from '@/components/dashboard/widgets';
import { HideBalancesToggle } from '@/components/hide-balances';
import type { BasicSummary, ChartEntry } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Dashboard' };

/** Pull one figure out of /summary/basic, whose keys are suffixed by currency. */
function summaryValue(summary: BasicSummary, prefix: string): { value: string; currency: string } {
  const entry = Object.entries(summary).find(([key]) => key.startsWith(prefix));
  if (!entry) return { value: '0', currency: 'EUR' };
  return { value: String(entry[1].monetary_value), currency: entry[1].currency_code };
}

/** /chart/* returns one object per series, each with a date→value map. */
function toTrend(charts: ChartEntry[]): { points: TrendPoint[]; series: string[] } {
  if (charts.length === 0) return { points: [], series: [] };

  const series = charts.map((chart) => chart.label);
  const dates = new Set<string>();
  for (const chart of charts) for (const date of Object.keys(chart.entries)) dates.add(date);

  const points = [...dates].sort().map((date) => {
    const point: TrendPoint = { date: date.slice(0, 10) };
    for (const chart of charts) {
      // Chart values are Firefly amounts. Recharts needs a number, so this is
      // the render boundary where lib/money hands one over.
      point[chart.label] = toDecimal(chart.entries[date] ?? 0).toNumber();
    }
    return point;
  });

  return { points, series };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  const params = await searchParams;
  const range = resolveRangeFromParams(params, session.user.timezone);
  const previous = previousPeriod(range);

  // Fetched in parallel; every call is failure-tolerant so one bad endpoint
  // degrades a single widget rather than the page (E3-13).
  const [summary, previousSummary, balanceChart, accounts, recent, categorySpend, bills, piggies] =
    await Promise.all([
      getBasicSummary(range.start, range.end),
      getBasicSummary(previous.start, previous.end),
      getBalanceChart(range.start, range.end),
      getAccountsSafe({ type: 'asset' }),
      getTransactions({ start: range.start, end: range.end, limit: 6 }).catch(() => ({
        data: [],
        meta: {},
      })),
      getExpenseByCategory(range.start, range.end),
      getBills(range.start, range.end),
      getPiggyBanks(),
    ]);

  const currency = connection.primaryCurrency;
  const netWorth = summaryValue(summary, 'net-worth-in-');
  const spent = summaryValue(summary, 'spent-in-');
  const earned = summaryValue(summary, 'earned-in-');
  const balance = summaryValue(summary, 'balance-in-');

  const trend = toTrend(balanceChart);

  const topCategories = categorySpend
    .map((entry) => ({
      name: entry.name ?? 'Uncategorised',
      value: Math.abs(entry.difference_float),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {connection.label} · {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideBalancesToggle />
          <DateRangePicker label={range.label} />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Net worth"
          value={netWorth.value}
          currency={netWorth.currency || currency}
          previous={summaryValue(previousSummary, 'net-worth-in-').value}
          tone="neutral"
        />
        <KpiTile
          label="Earned"
          value={earned.value}
          currency={earned.currency || currency}
          previous={summaryValue(previousSummary, 'earned-in-').value}
          tone="income"
        />
        <KpiTile
          label="Spent"
          value={spent.value}
          currency={spent.currency || currency}
          previous={summaryValue(previousSummary, 'spent-in-').value}
          tone="expense"
        />
        <KpiTile
          label="Balance"
          value={balance.value}
          currency={balance.currency || currency}
          previous={summaryValue(previousSummary, 'balance-in-').value}
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-medium">Balance over time</h2>
          <AreaTrend data={trend.points} series={trend.series} currency={currency} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetCard title="Accounts" href="/accounts">
          <AccountBalanceList accounts={accounts.data.slice(0, 6)} />
        </WidgetCard>

        <WidgetCard title="Recent transactions" href="/transactions">
          <RecentTransactions transactions={recent.data} timezone={session.user.timezone} />
        </WidgetCard>

        <WidgetCard title="Top spending categories">
          <CategoryBars data={topCategories} currency={currency} height={220} />
        </WidgetCard>

        <WidgetCard title="Upcoming bills">
          <UpcomingBills bills={bills.data} timezone={session.user.timezone} />
        </WidgetCard>

        <WidgetCard title="Savings goals">
          <PiggyProgress piggies={piggies.data} />
        </WidgetCard>
      </div>
    </div>
  );
}
