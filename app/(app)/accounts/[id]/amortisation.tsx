import { toDecimal } from '@/lib/money';
import {
  buildSchedule,
  monthlyRate,
  typicalPayment,
  yearlySummary,
  type Schedule,
} from '@/lib/amortisation';
import { formatMonthLabel } from '@/lib/date';
import type { Account, Transaction } from '@/server/firefly/types';
import { Amount } from '@/components/ui/amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/input';

const PERIOD_LABEL: Record<string, string> = {
  daily: 'per day',
  monthly: 'per month',
  yearly: 'per year',
};

/**
 * The payments this liability has received, for guessing the regular one.
 * Only movements between this account and an asset account count: an opening
 * balance or a reconciliation is not a payment, and neither is a fee charged
 * to the loan by an expense account.
 */
function recentPayments(accountId: string, transactions: Transaction[]): string[] {
  const amounts: string[] = [];
  for (const group of transactions) {
    for (const split of group.attributes.transactions) {
      if (split.type === 'opening balance' || split.type === 'reconciliation') continue;
      const into = split.destination_id === accountId && split.source_type === 'Asset account';
      const outOf = split.source_id === accountId && split.destination_type === 'Asset account';
      if (into || outOf) amounts.push(split.amount);
    }
  }
  return amounts;
}

/** E4-07 — the liability amortisation view: a projection, labelled as one. */
export function AmortisationPanel({
  account,
  transactions,
  currency,
  decimals,
  startMonth,
  query,
  basePath,
  timezone,
  locale,
}: {
  account: Account;
  transactions: Transaction[];
  currency: string;
  decimals: number;
  /** `YYYY-MM` of the next payment — the month after today. */
  startMonth: string;
  query: Record<string, string | string[] | undefined>;
  basePath: string;
  timezone: string;
  locale: string;
}) {
  const a = account.attributes;
  const detected = typicalPayment(recentPayments(account.id, transactions));
  const typed = typeof query.payment === 'string' ? query.payment.trim() : '';
  const extraTyped = typeof query.extra === 'string' ? query.extra.trim() : '';
  const payment = typed && toDecimal(typed).greaterThan(0) ? typed : detected;
  const extra = extraTyped && toDecimal(extraTyped).greaterThan(0) ? extraTyped : '';
  const rate = monthlyRate(a.interest, a.interest_period);
  const outstanding = toDecimal(a.current_balance).abs().toString();

  const schedule = payment
    ? buildSchedule({ balance: outstanding, rate, payment, startMonth })
    : null;
  const withExtra =
    payment && extra
      ? buildSchedule({ balance: outstanding, rate, payment, extra, startMonth })
      : null;

  const interestLabel =
    a.interest && toDecimal(a.interest).greaterThan(0)
      ? `${a.interest}% ${PERIOD_LABEL[a.interest_period ?? 'yearly'] ?? a.interest_period}`
      : 'No interest rate set';

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Payoff projection</h2>
            <p className="text-muted-foreground text-sm">
              From today&rsquo;s balance of{' '}
              <Amount
                value={outstanding}
                currency={currency}
                decimalPlaces={decimals}
                showSign={false}
                tone="neutral"
                size="sm"
              />{' '}
              at {interestLabel}. Firefly III records the rate but never books interest, so this
              applies it forward from today rather than reconstructing the past.
            </p>
          </div>

          <form method="get" action={basePath} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value="amortisation" />
            <div className="w-40 space-y-1.5">
              <Label htmlFor="payment">Monthly payment</Label>
              <CurrencyInput
                id="payment"
                name="payment"
                defaultValue={payment ?? ''}
                placeholder="0.00"
              />
            </div>
            <div className="w-40 space-y-1.5">
              <Label htmlFor="extra">Extra each month</Label>
              <CurrencyInput id="extra" name="extra" defaultValue={extra} placeholder="0.00" />
            </div>
            <Button type="submit" variant="outline">
              Recalculate
            </Button>
          </form>
          <p className="text-muted-foreground text-xs">
            {typed
              ? 'Using the payment you entered.'
              : detected
                ? 'Payment guessed from the median of recent payments into this account.'
                : 'No recent payments found — enter the monthly payment to see a schedule.'}
          </p>
        </CardContent>
      </Card>

      {schedule ? (
        <ScheduleSummary
          schedule={schedule}
          withExtra={withExtra}
          currency={currency}
          timezone={timezone}
          locale={locale}
        />
      ) : null}

      {schedule && schedule.rows.length > 0 ? (
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <caption className="sr-only">Projected balance by year</caption>
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-medium">
                    Year
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium max-sm:hidden">
                    Paid
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Interest
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Principal
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {yearlySummary(schedule.rows).map((row) => (
                  <tr key={row.year}>
                    <th scope="row" className="px-4 py-2 text-left font-medium tabular-nums">
                      {row.year}
                    </th>
                    <td className="px-4 py-2 text-right max-sm:hidden">
                      <Amount
                        value={row.paid}
                        currency={currency}
                        showSign={false}
                        size="sm"
                        tone="neutral"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Amount
                        value={row.interest}
                        currency={currency}
                        showSign={false}
                        size="sm"
                        tone="expense"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Amount
                        value={row.principal}
                        currency={currency}
                        showSign={false}
                        size="sm"
                        tone="neutral"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Amount
                        value={row.balance}
                        currency={currency}
                        showSign={false}
                        size="sm"
                        tone="neutral"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ScheduleSummary({
  schedule,
  withExtra,
  currency,
  timezone,
  locale,
}: {
  schedule: Schedule;
  withExtra: Schedule | null;
  currency: string;
  timezone: string;
  locale: string;
}) {
  if (schedule.status === 'settled') {
    return <Notice>Nothing is owed on this account.</Notice>;
  }
  if (schedule.status === 'never') {
    return (
      <Notice tone="warning">
        This payment does not cover the interest — the first month alone accrues{' '}
        <Amount value={schedule.firstInterest} currency={currency} showSign={false} size="sm" />, so
        the balance would never fall. Enter a larger payment.
      </Notice>
    );
  }

  const years = Math.floor(schedule.months / 12);
  const months = schedule.months % 12;
  const duration = [years ? `${years} yr` : null, months ? `${months} mo` : null]
    .filter(Boolean)
    .join(' ');

  const saved =
    withExtra && withExtra.status === 'ok'
      ? {
          months: schedule.months - withExtra.months,
          interest: toDecimal(schedule.totalInterest).minus(withExtra.totalInterest).toString(),
          payoff: withExtra.payoffMonth,
        }
      : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Paid off">
          {schedule.payoffMonth
            ? formatMonthLabel(schedule.payoffMonth, timezone, locale)
            : 'Not within 50 years'}
          <span className="text-muted-foreground block text-xs font-normal">{duration}</span>
        </Stat>
        <Stat label="Interest to pay">
          <Amount
            value={schedule.totalInterest}
            currency={currency}
            showSign={false}
            size="lg"
            tone="expense"
          />
        </Stat>
        <Stat label="Total to pay">
          <Amount
            value={schedule.totalPaid}
            currency={currency}
            showSign={false}
            size="lg"
            tone="neutral"
          />
        </Stat>
      </div>
      {saved && saved.months > 0 ? (
        <Notice>
          Paying the extra clears it {saved.months} month{saved.months === 1 ? '' : 's'} sooner
          {saved.payoff ? `, in ${formatMonthLabel(saved.payoff, timezone, locale)},` : ''} and
          saves <Amount value={saved.interest} currency={currency} showSign={false} size="sm" /> in
          interest.
        </Notice>
      ) : null}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div className="text-lg font-semibold">{children}</div>
      </CardContent>
    </Card>
  );
}

function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning';
  children: React.ReactNode;
}) {
  return (
    <p
      className={
        tone === 'warning'
          ? 'bg-warning-muted text-warning-foreground rounded-md px-3 py-2 text-sm'
          : 'bg-muted rounded-md px-3 py-2 text-sm'
      }
    >
      {children}
    </p>
  );
}
