import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getPreferences } from '@/server/preferences';
import { getDashboardLayout } from '@/server/dashboard';
import {
  CustomizeDashboardButton,
  DashboardGrid,
  type DashboardWidget,
} from '@/components/dashboard/dashboard-grid';
import { getActiveConnection, readFailure } from '@/server/firefly/api';
import {
  getAccountsSafe,
  getAccountOverviewChart,
  getBasicSummary,
  getBills,
  getBudgetLimits,
  getBudgets,
  getExpenseByCategory,
  getExchangeRates,
  getNetWorthAccounts,
  getPiggyBanks,
  getTransactions,
} from '@/server/firefly/queries';
import type { Budget, BudgetLimit } from '@/server/firefly/types';
import { previousPeriod, resolveRangeFromParams } from '@/lib/date-range';
import { now, toApiDate } from '@/lib/date';
import { buildRateTable, convertSpent } from '@/lib/budget-currency';
import { convertSummaryEntries } from '@/lib/currency-convert';
import { buildBalanceTrend } from '@/lib/balance-trend';
import { toDecimal } from '@/lib/money';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
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
import { ErrorState } from '@/components/error-state';
import { classifyError } from '@/lib/error-taxonomy';
import { AddTransactionSheet } from '@/components/transactions/add-sheet';
import { listSavedReports } from '@/server/reports';
import { describeConfig, parseConfig } from '@/lib/custom-report';
import { Amount } from '@/components/ui/amount';
import type { BasicSummary } from '@/server/firefly/types';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Pull one figure out of /summary/basic, converting all currencies to the
 * primary one. Previously this picked a single currency entry and silently
 * dropped the rest; now it sums every currency variant through the rate table
 * so the dashboard total matches the budget screen for the same period.
 */
function summaryValue(
  summary: BasicSummary,
  prefix: string,
  preferred: string,
  rateTable: ReturnType<typeof buildRateTable> | null,
) {
  return convertSummaryEntries(summary, prefix, preferred, rateTable);
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

  const [preferences, layout] = await Promise.all([
    getPreferences(),
    getDashboardLayout(session.user.id),
  ]);

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
    ratesResult,
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
    getExchangeRates(),
    getNetWorthAccounts(),
  ]);

  // E14-10 — custom reports the user pinned. Read after the widget fan-out and
  // tolerant of failure, so the dashboard is never blocked or blanked by it.
  const pinnedReports = await listSavedReports(session.user.id)
    .then((rows) => rows.filter((row) => row.isPinned))
    .catch(() => []);

  const currency = connection.primaryCurrency;
  const rateTable = buildRateTable(ratesResult.data);

  const netWorth = summaryValue(summary, 'net-worth-in-', currency, rateTable);
  const spent = summaryValue(summary, 'spent-in-', currency, rateTable);
  const earned = summaryValue(summary, 'earned-in-', currency, rateTable);
  const balance = summaryValue(summary, 'balance-in-', currency, rateTable);

  // Previous-period comparison must also convert, so the delta is apples to
  // apples.
  const prevNetWorth = summaryValue(previousSummary, 'net-worth-in-', currency, rateTable);
  const prevEarned = summaryValue(previousSummary, 'earned-in-', currency, rateTable);
  const prevSpent = summaryValue(previousSummary, 'spent-in-', currency, rateTable);
  const prevBalance = summaryValue(previousSummary, 'balance-in-', currency, rateTable);

  // Collect disclosure info: if any KPI converted foreign currencies, show a
  // single note under the grid.
  const allConverted = new Set<string>();
  const allUnconvertible = new Set<string>();
  for (const kpi of [netWorth, spent, earned, balance]) {
    for (const code of kpi.convertedCurrencies) allConverted.add(code);
    for (const code of kpi.unconvertible) allUnconvertible.add(code);
  }

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

  // E3-12 — each widget is rendered here, on the server, and handed to the
  // grid by id; the grid only decides order and visibility. A widget with
  // nothing to show is left out rather than rendered empty.
  const widgets: DashboardWidget[] = [
    {
      id: 'kpis',
      node: (
        <>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <KpiTile
              label="Net worth"
              value={netWorth.value}
              currency={currency}
              previous={prevNetWorth.value}
              tone="neutral"
            />
            <KpiTile
              label="Earned"
              value={earned.value}
              currency={currency}
              previous={prevEarned.value}
              tone="income"
            />
            <KpiTile
              label="Spent"
              value={spent.value}
              currency={currency}
              previous={prevSpent.value}
              tone="expense"
            />
            <KpiTile
              label="Balance"
              value={balance.value}
              currency={currency}
              previous={prevBalance.value}
            />
          </div>
          {allConverted.size > 0 || allUnconvertible.size > 0 ? (
            <p className="text-muted-foreground truncate text-xs">
              {allConverted.size > 0
                ? `Includes ${[...allConverted].sort().join(', ')} converted to ${currency}${rateTable.asOf ? ` (rates as of ${rateTable.asOf})` : ''}`
                : `Amounts in ${[...allUnconvertible].sort().join(', ')} not included — no conversion rate`}
              {allConverted.size > 0 && allUnconvertible.size > 0
                ? `. ${[...allUnconvertible].sort().join(', ')} could not be converted`
                : ''}
            </p>
          ) : null}
        </>
      ),
    },
    {
      id: 'net-worth',
      node: (
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
      ),
    },
    {
      id: 'accounts',
      node: (
        <WidgetCard title="Accounts" href="/accounts">
          <AccountBalanceList
            accounts={accounts.data.filter((a) => a.attributes.active).slice(0, 6)}
          />
        </WidgetCard>
      ),
    },
    {
      id: 'recent',
      node: (
        <WidgetCard title="Recent transactions" href="/transactions">
          <RecentTransactions transactions={recent.data} timezone={session.user.timezone} />
        </WidgetCard>
      ),
    },
    {
      id: 'categories',
      node: (
        <WidgetCard title="Top spending categories">
          <CategoryBars data={topCategories} currency={currency} height={220} />
        </WidgetCard>
      ),
    },
    {
      id: 'bills',
      node: (
        <WidgetCard title="Upcoming bills">
          <UpcomingBills
            bills={bills.data}
            timezone={session.user.timezone}
            defaultCurrency={currency}
          />
        </WidgetCard>
      ),
    },
    {
      id: 'savings',
      node: (
        <WidgetCard title="Savings goals">
          <PiggyProgress piggies={piggies.data} defaultCurrency={currency} />
        </WidgetCard>
      ),
    },
    {
      id: 'budgets',
      node: (
        <WidgetCard title="Budget progress" href="/budgets">
          <BudgetProgressWidget
            budgets={budgetsResult.data}
            limits={limitsResult.data}
            defaultCurrency={currency}
            rateTable={rateTable}
          />
        </WidgetCard>
      ),
    },
  ];

  if (pinnedReports.length > 0) {
    widgets.push({
      id: 'pinned',
      node: (
        <WidgetCard title="Pinned reports" href="/reports">
          <ul className="space-y-2">
            {pinnedReports.map((report) => {
              const config = parseConfig(report.config);
              return (
                <li key={report.id}>
                  <a
                    href={`/reports/custom?range=${range.preset}&metric=${config.metric}&dimension=${config.dimension}&chart=${config.chart}&limit=${config.limit}`}
                    className="hover:bg-accent -mx-2 block rounded-md px-2 py-1.5"
                  >
                    <p className="truncate text-sm font-medium">{report.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {describeConfig(config)}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>
        </WidgetCard>
      ),
    });
  }

  return (
    // No bottom padding of its own on a phone: the app shell's <main> leaves
    // room for the bottom bar on every page, which replaced the floating add
    // button this page used to clear.
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground truncate text-sm">
            {connection.label} · {range.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomizeDashboardButton />
          <span data-tour="hide-balances" className="inline-flex">
            <HideBalancesToggle defaultHidden={preferences.hideBalances} />
          </span>
          <span data-tour="date-range" className="inline-flex">
            <DateRangePicker label={range.label} />
          </span>
          {/*
            E3-16 — the dashboard was read-only: every figure on it comes from
            transactions and there was no way to add one without leaving for
            another section first. The asset accounts are handed over because
            the page has already loaded them, so the common case opens with the
            right account already chosen and needs no lookup at all.
          */}
          <span data-tour="add-transaction" className="inline-flex">
            <AddTransactionSheet
              today={toApiDate(now(session.user.timezone), session.user.timezone)}
              currency={currency}
              assetAccounts={accounts.data
                .filter((a) => a.attributes.active)
                .map((account) => ({
                  id: account.id,
                  name: account.attributes.name,
                }))}
            />
          </span>
        </div>
      </header>

      {/*
        A failed read is not a zero.
        `fireflyGetSafe` swallows a failure and returns a fallback, so with the
        instance unreachable this page rendered "Net worth €0", "Spent €0" and
        "No transactions yet" — telling someone their money is gone, in the
        confident typography of a real figure. Exactly the bug docs/LEARNING.md
        §7a records for /budgets; the dashboard still had it, and it is worse
        here because this is the page people open first.

        Every tile on this page comes from the same connection, so one failed
        read means none of the figures below can be trusted. The page reports
        the error instead of inventing twelve zeroes.
      */}
      {readFailure() ? (
        <ErrorState kind={classifyError(readFailure())} />
      ) : (
        <DashboardGrid initialLayout={layout} widgets={widgets} />
      )}
    </div>
  );
}

/** E3-08 — burn-down pacing for budgets with a limit this period. */
function BudgetProgressWidget({
  budgets,
  limits,
  defaultCurrency,
  rateTable,
}: {
  budgets: Budget[];
  limits: BudgetLimit[];
  defaultCurrency: string;
  rateTable: ReturnType<typeof buildRateTable>;
}) {
  // Index limits by budget id — prefer the primary currency, fall back to first.
  const limitForBudget = new Map<string, BudgetLimit>();
  for (const limit of limits) {
    const bid = limit.attributes.budget_id;
    const cur = limit.attributes.currency_code ?? defaultCurrency;
    const existing = limitForBudget.get(bid);
    if (!existing) {
      limitForBudget.set(bid, limit);
    } else {
      const existingCur = existing.attributes.currency_code ?? defaultCurrency;
      if (cur === defaultCurrency && existingCur !== defaultCurrency) {
        limitForBudget.set(bid, limit);
      } else if (cur === existingCur && limit.attributes.start > existing.attributes.start) {
        limitForBudget.set(bid, limit);
      }
    }
  }

  const withProgress = budgets
    .map((budget) => {
      const limit = limitForBudget.get(budget.id);
      if (!limit) return null;
      const converted = convertSpent(budget.attributes.spent, defaultCurrency, rateTable);
      const amount = toDecimal(limit.attributes.amount);
      const spentSum = toDecimal(converted.amount);
      const pct = amount.greaterThan(0)
        ? Math.min(100, spentSum.dividedBy(amount).times(100).toNumber())
        : 0;
      return {
        id: budget.id,
        name: budget.attributes.name,
        percent: pct,
        amount: limit.attributes.amount,
        spent: spentSum.toString(),
        currency: defaultCurrency,
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
            <ProgressBar
              value={item!.percent}
              over={item!.over}
              size="sm"
              label={`${item!.name} budget usage`}
            />
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
