import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import {
  getAccountsSafe,
  getAccountOverviewChart,
  getBasicSummary,
  getBills,
  getBudgetLimits,
  getBudgets,
  getExpenseByCategory,
  getNetWorthAccounts,
  getPiggyBanks,
  getTransactions,
} from '@/server/firefly/queries';
import type { Budget, BudgetLimit } from '@/server/firefly/types';
import { previousPeriod, resolveRangeFromParams } from '@/lib/date-range';
import { buildBalanceTrend } from '@/lib/balance-trend';
import { toDecimal } from '@/lib/money';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { BalanceTrend } from '@/components/charts/balance-trend';
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
import { Amount } from '@/components/ui/amount';
import type { BasicSummary } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Pull one figure out of /summary/basic.
 *
 * Firefly emits one entry PER CURRENCY, keyed `spent-in-BDT`, `spent-in-USD`
 * and so on. Taking the first match meant a multi-currency ledger could show
 * net worth in one currency and spending in another, purely by key order.
 * Prefer the connection's primary currency; fall back to the largest figure so
 * a tile never silently reports a trivial secondary balance as the headline.
 */
function summaryValue(
  summary: BasicSummary,
  prefix: string,
  preferred: string,
): { value: string; currency: string } {
  const matches = Object.entries(summary).filter(([key]) => key.startsWith(prefix));
  if (matches.length === 0) return { value: '0', currency: preferred };

  const exact = matches.find(([, entry]) => entry.currency_code === preferred);
  const chosen =
    exact ??
    matches.reduce((best, current) =>
      Math.abs(current[1].monetary_value) > Math.abs(best[1].monetary_value) ? current : best,
    );

  return { value: String(chosen[1].monetary_value), currency: chosen[1].currency_code };
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
  const [
    summary,
    previousSummary,
    balanceChart,
    accounts,
    recent,
    categorySpend,
    bills,
    piggies,
    budgetsResult,
    limitsResult,
    netWorthAccounts,
  ] = await Promise.all([
    getBasicSummary(range.start, range.end),
    getBasicSummary(previous.start, previous.end),
    getAccountOverviewChart(range.start, range.end),
    getAccountsSafe({ type: 'asset' }),
    getTransactions({ start: range.start, end: range.end, limit: 6 }).catch(() => ({
      data: [],
      meta: {},
    })),
    getExpenseByCategory(range.start, range.end),
    getBills(range.start, range.end),
    getPiggyBanks(),
    getBudgets(range.start, range.end),
    getBudgetLimits(range.start, range.end),
    getNetWorthAccounts(),
  ]);

  const currency = connection.primaryCurrency;

  const netWorth = summaryValue(summary, 'net-worth-in-', currency);
  const spent = summaryValue(summary, 'spent-in-', currency);
  const earned = summaryValue(summary, 'earned-in-', currency);
  const balance = summaryValue(summary, 'balance-in-', currency);

  // `/chart/account/overview?preselected=all` reports EVERY asset and liability
  // account, including archived ones and ones the user flagged out of net
  // worth. Firefly's own net-worth figure skips both. Without matching that,
  // this chart's total contradicts the Net worth tile directly above it —
  // measured on a real ledger, the two differed by 4.7M and then by a constant
  // 56,499.60 once only the opt-outs were handled, the remainder being three
  // archived accounts.
  const excludedFromNetWorth = new Set(
    netWorthAccounts
      .filter(
        (account) =>
          account.attributes.include_net_worth === false || account.attributes.active === false,
      )
      .map((account) => account.attributes.name),
  );

  const trend = buildBalanceTrend(balanceChart, currency, {
    excludeLabels: excludedFromNetWorth,
  });

  const topCategories = categorySpend
    .map((entry) => ({
      name: entry.name ?? 'Uncategorised',
      value: Math.abs(entry.difference_float),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground truncate text-sm">
            {connection.label} · {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideBalancesToggle />
          <DateRangePicker label={range.label} />
        </div>
      </header>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Net worth"
          value={netWorth.value}
          currency={netWorth.currency || currency}
          previous={summaryValue(previousSummary, 'net-worth-in-', currency).value}
          tone="neutral"
        />
        <KpiTile
          label="Earned"
          value={earned.value}
          currency={earned.currency || currency}
          previous={summaryValue(previousSummary, 'earned-in-', currency).value}
          tone="income"
        />
        <KpiTile
          label="Spent"
          value={spent.value}
          currency={spent.currency || currency}
          previous={summaryValue(previousSummary, 'spent-in-', currency).value}
          tone="expense"
        />
        <KpiTile
          label="Balance"
          value={balance.value}
          currency={balance.currency || currency}
          previous={summaryValue(previousSummary, 'balance-in-', currency).value}
        />
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Net worth over time</h2>
              <p className="text-muted-foreground text-xs">{range.label}</p>
            </div>

            {trend.points.length > 0 ? (
              <div className="min-w-0 text-right">
                <Amount
                  value={trend.closing}
                  currency={trend.currency}
                  size="lg"
                  showSign={false}
                  tone="neutral"
                  compact
                />
                <p className="text-muted-foreground mt-0.5 flex items-center justify-end gap-1 text-xs">
                  <Amount
                    value={trend.change}
                    currency={trend.currency}
                    size="sm"
                    compact
                    tone="auto"
                  />
                  {trend.changePercent === null ? null : (
                    <span className={trend.change >= 0 ? 'text-income' : 'text-expense'}>
                      ({trend.changePercent >= 0 ? '+' : ''}
                      {trend.changePercent.toFixed(1)}%)
                    </span>
                  )}
                  <span>this period</span>
                </p>
              </div>
            ) : null}
          </div>

          <BalanceTrend
            data={trend}
            timezone={session.user.timezone}
            locale={session.user.locale}
          />
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
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
          <UpcomingBills
            bills={bills.data}
            timezone={session.user.timezone}
            defaultCurrency={currency}
          />
        </WidgetCard>

        <WidgetCard title="Savings goals">
          <PiggyProgress piggies={piggies.data} defaultCurrency={currency} />
        </WidgetCard>

        <WidgetCard title="Budget progress" href="/budgets">
          <BudgetProgressWidget
            budgets={budgetsResult.data}
            limits={limitsResult.data}
            defaultCurrency={currency}
          />
        </WidgetCard>
      </div>
    </div>
  );
}

/** E3-08 — burn-down pacing for budgets with a limit this period. */
function BudgetProgressWidget({
  budgets,
  limits,
  defaultCurrency,
}: {
  budgets: Budget[];
  limits: BudgetLimit[];
  defaultCurrency: string;
}) {
  const limitsByBudget = new Map<string, BudgetLimit>();
  for (const limit of limits) {
    limitsByBudget.set(limit.attributes.budget_id, limit);
  }

  const withProgress = budgets
    .map((budget) => {
      const limit = limitsByBudget.get(budget.id);
      if (!limit) return null;
      const spent = budget.attributes.spent?.[0];
      const amount = toDecimal(limit.attributes.amount);
      const spentSum = spent ? toDecimal(spent.sum).abs() : toDecimal(0);
      const pct = amount.greaterThan(0)
        ? Math.min(100, spentSum.dividedBy(amount).times(100).toNumber())
        : 0;
      const currency = spent?.currency_code ?? limit.attributes.currency_code ?? defaultCurrency;
      return {
        id: budget.id,
        name: budget.attributes.name,
        percent: pct,
        amount: limit.attributes.amount,
        spent: spentSum.toString(),
        currency,
        over: spentSum.greaterThan(amount),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.percent - a!.percent)
    .slice(0, 5);

  if (withProgress.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No budgets have limits set for this period.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {withProgress.map((item) => (
        <li key={item!.id}>
          <a href={`/budgets/${item!.id}`} className="block">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{item!.name}</span>
              <span className="text-muted-foreground tabular text-xs">
                {item!.percent.toFixed(0)}%
              </span>
            </div>
            <div
              className="bg-muted h-1.5 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={item!.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item!.name} budget usage`}
            >
              <div
                className={item!.over ? 'bg-expense h-full' : 'bg-primary h-full'}
                style={{ width: `${item!.percent}%` }}
              />
            </div>
            <div className="text-muted-foreground mt-1 flex justify-between text-xs">
              <Amount value={item!.spent} currency={item!.currency} showSign={false} size="sm" />
              <Amount value={item!.amount} currency={item!.currency} showSign={false} size="sm" />
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
