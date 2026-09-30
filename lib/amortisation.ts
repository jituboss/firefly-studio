import Decimal from 'decimal.js';
import { toDecimal } from '@/lib/money';

/**
 * E4-07 — a liability's amortisation schedule: at a given monthly payment,
 * how much of each payment is interest, when the balance reaches zero, and
 * what the whole thing costs.
 *
 * A PROJECTION, and the page says so. Firefly stores a rate and a period on a
 * liability but never books interest itself — the balance it reports is the
 * opening debt minus whatever was paid in. So this starts from today's
 * outstanding balance and applies the stated rate forward; it does not try to
 * reconstruct the past.
 *
 * Money stays in decimal.js throughout (docs/LEARNING.md §5 rule 1). Each
 * period's interest is rounded to the cent before it is added, the way a
 * lender's statement does it, so the rows add up to the totals exactly.
 */

export type InterestPeriod = 'daily' | 'monthly' | 'yearly';

const CENTS = 2;

function cents(value: Decimal): Decimal {
  return value.toDecimalPlaces(CENTS, Decimal.ROUND_HALF_UP);
}

/**
 * The effective MONTHLY rate, as a fraction (0.0028 for 0.28 %).
 *
 * Yearly is the nominal annual rate over twelve, which is how mortgages and
 * most loans quote it. Daily is compounded up to a month, because a daily
 * rate is what card and overdraft interest accrues at. Unknown periods are
 * treated as yearly, the common case and the one Firefly defaults to.
 */
export function monthlyRate(interest: string | null, period: string | null): Decimal {
  const percent = toDecimal(interest ?? '0');
  if (percent.lessThanOrEqualTo(0)) return new Decimal(0);
  const rate = percent.dividedBy(100);
  if (period === 'monthly') return rate;
  if (period === 'daily') return rate.plus(1).pow(new Decimal(365).dividedBy(12)).minus(1);
  return rate.dividedBy(12);
}

/** `YYYY-MM` plus n months, as strings — no Date, so no timezone. */
export function addMonths(month: string, n: number): string {
  const [year, mon] = month.split('-').map((part) => Number.parseInt(part, 10));
  const index = year! * 12 + (mon! - 1) + n;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * The payment to assume when the user has not typed one: the median of the
 * recent payments, so one lump-sum overpayment does not drag the projection.
 */
export function typicalPayment(amounts: string[]): string | null {
  const values = amounts
    .map((amount) => toDecimal(amount).abs())
    .filter((value) => value.greaterThan(0))
    .sort((a, b) => a.comparedTo(b));
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 1 ? values[mid]! : values[mid - 1]!.plus(values[mid]!).dividedBy(2);
  return cents(median).toFixed(CENTS);
}

export interface ScheduleRow {
  /** `YYYY-MM`. */
  month: string;
  payment: string;
  interest: string;
  principal: string;
  balance: string;
}

export type ScheduleStatus =
  /** Paid off within the horizon. */
  | 'ok'
  /** Nothing owed. */
  | 'settled'
  /** The payment does not cover the interest, so the balance never falls. */
  | 'never'
  /** Still owing at the horizon — a very long loan, or a very small payment. */
  | 'horizon';

export interface Schedule {
  status: ScheduleStatus;
  rows: ScheduleRow[];
  months: number;
  totalPaid: string;
  totalInterest: string;
  /** `YYYY-MM` of the final payment, when there is one. */
  payoffMonth: string | null;
  /** The first month's interest — what the payment has to beat. */
  firstInterest: string;
}

export interface ScheduleInput {
  /** Outstanding balance, sign ignored. */
  balance: string;
  /** From `monthlyRate`. */
  rate: Decimal;
  /** Regular monthly payment, sign ignored. */
  payment: string;
  /** Extra paid on top every month. */
  extra?: string;
  /** `YYYY-MM` of the first projected payment. */
  startMonth: string;
  /** Longest schedule to compute. 50 years covers any real mortgage. */
  maxMonths?: number;
}

export function buildSchedule(input: ScheduleInput): Schedule {
  const maxMonths = input.maxMonths ?? 600;
  let balance = cents(toDecimal(input.balance).abs());
  const regular = toDecimal(input.payment)
    .abs()
    .plus(toDecimal(input.extra ?? '0').abs());
  const firstInterest = cents(balance.times(input.rate));

  const empty = (status: ScheduleStatus): Schedule => ({
    status,
    rows: [],
    months: 0,
    totalPaid: '0.00',
    totalInterest: '0.00',
    payoffMonth: null,
    firstInterest: firstInterest.toFixed(CENTS),
  });

  if (balance.isZero()) return empty('settled');
  // Checked up front rather than discovered 600 rows later: a payment that
  // does not beat the first month's interest never will, because the balance
  // only grows from there.
  if (regular.lessThanOrEqualTo(firstInterest)) return empty('never');

  const rows: ScheduleRow[] = [];
  let totalPaid = new Decimal(0);
  let totalInterest = new Decimal(0);

  for (let i = 0; i < maxMonths && balance.greaterThan(0); i += 1) {
    const interest = cents(balance.times(input.rate));
    const owed = balance.plus(interest);
    const payment = Decimal.min(regular, owed);
    const principal = payment.minus(interest);
    balance = owed.minus(payment);
    totalPaid = totalPaid.plus(payment);
    totalInterest = totalInterest.plus(interest);
    rows.push({
      month: addMonths(input.startMonth, i),
      payment: payment.toFixed(CENTS),
      interest: interest.toFixed(CENTS),
      principal: principal.toFixed(CENTS),
      balance: balance.toFixed(CENTS),
    });
  }

  const paidOff = balance.isZero();
  return {
    status: paidOff ? 'ok' : 'horizon',
    rows,
    months: rows.length,
    totalPaid: totalPaid.toFixed(CENTS),
    totalInterest: totalInterest.toFixed(CENTS),
    payoffMonth: paidOff ? (rows.at(-1)?.month ?? null) : null,
    firstInterest: firstInterest.toFixed(CENTS),
  };
}

/** Group a schedule by calendar year, for the summary table. */
export function yearlySummary(
  rows: ScheduleRow[],
): Array<{ year: string; paid: string; interest: string; principal: string; balance: string }> {
  const years = new Map<
    string,
    { paid: Decimal; interest: Decimal; principal: Decimal; balance: string }
  >();
  for (const row of rows) {
    const year = row.month.slice(0, 4);
    const entry = years.get(year) ?? {
      paid: new Decimal(0),
      interest: new Decimal(0),
      principal: new Decimal(0),
      balance: row.balance,
    };
    entry.paid = entry.paid.plus(row.payment);
    entry.interest = entry.interest.plus(row.interest);
    entry.principal = entry.principal.plus(row.principal);
    entry.balance = row.balance;
    years.set(year, entry);
  }
  return [...years].map(([year, entry]) => ({
    year,
    paid: entry.paid.toFixed(CENTS),
    interest: entry.interest.toFixed(CENTS),
    principal: entry.principal.toFixed(CENTS),
    balance: entry.balance,
  }));
}
