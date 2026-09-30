import { abs, subtract, toDecimal } from '@/lib/money';
import { buildBreakdown, insightTotal, type InsightLike } from '@/lib/reports';

/**
 * E14-15 — does what the reports show agree with Firefly's own figures?
 *
 * Two independent sources are compared, to the cent:
 *
 *  1. `/summary/basic` — Firefly's own headline numbers, the same ones its
 *     dashboard shows. This is the reference.
 *  2. The `/insight/*` totals and breakdowns, run through the SAME functions
 *     the report pages use (`insightTotal`, `buildBreakdown`). A mistake in
 *     those — dropping a currency, double-counting a split resource, losing
 *     the "no category" bucket — shows up here as a mismatch.
 *
 * Each breakdown is checked as a PARTITION of the total: categories plus
 * "without category" must equal all spending, and so on. Tags are left out on
 * purpose: one transaction can carry several tags, so tag totals legitimately
 * exceed the total (measured: 28,682.30 of tags against 26,642.01 of spending).
 *
 * Pure. `scripts/check-reconcile.ts` does the fetching against a live
 * instance; this decides what agrees.
 */

export interface SummaryLike {
  monetary_value: string | number;
  currency_code: string;
}

export interface ReconcileInput {
  currency: string;
  summary: Record<string, SummaryLike>;
  expenseTotal: InsightLike[];
  incomeTotal: InsightLike[];
  /** Each value is the list of insight payloads that together should cover the total. */
  expensePartitions: Record<string, InsightLike[][]>;
  incomePartitions: Record<string, InsightLike[][]>;
}

export interface ReconcileCheck {
  name: string;
  /** What the report pages would show. */
  ours: string;
  /** Firefly's own figure. */
  theirs: string;
  ok: boolean;
}

/** One figure from `/summary/basic`, as a positive magnitude. Missing is zero. */
export function summaryMagnitude(
  summary: Record<string, SummaryLike>,
  prefix: 'spent' | 'earned' | 'balance',
  currency: string,
): string {
  const entry = summary[`${prefix}-in-${currency.toUpperCase()}`];
  const value = toDecimal(entry ? String(entry.monetary_value) : '0');
  return (prefix === 'balance' ? value : abs(value)).toFixed(2);
}

function check(name: string, ours: string, theirs: string): ReconcileCheck {
  const a = toDecimal(ours).toFixed(2);
  const b = toDecimal(theirs).toFixed(2);
  return { name, ours: a, theirs: b, ok: a === b };
}

export function reconcile(input: ReconcileInput): ReconcileCheck[] {
  const { currency } = input;
  const spent = summaryMagnitude(input.summary, 'spent', currency);
  const earned = summaryMagnitude(input.summary, 'earned', currency);
  const balance = summaryMagnitude(input.summary, 'balance', currency);

  const expense = insightTotal(input.expenseTotal, currency);
  const income = insightTotal(input.incomeTotal, currency);

  const checks: ReconcileCheck[] = [
    check('Spending total = Firefly "spent"', expense, spent),
    check('Income total = Firefly "earned"', income, earned),
    check('Income − spending = Firefly "balance"', subtract(income, expense).toString(), balance),
  ];

  // Filtered to the currency first: with nothing in it, `buildBreakdown` would
  // fall back to whichever currency is largest and compare dollars to euros.
  const partitionTotal = (parts: InsightLike[][]) =>
    buildBreakdown(
      parts.flat().filter((entry) => entry.currency_code?.toUpperCase() === currency.toUpperCase()),
      currency,
      { rollUp: false },
    ).total;

  for (const [name, parts] of Object.entries(input.expensePartitions)) {
    checks.push(check(`Spending by ${name} adds up`, partitionTotal(parts), spent));
  }
  for (const [name, parts] of Object.entries(input.incomePartitions)) {
    checks.push(check(`Income by ${name} adds up`, partitionTotal(parts), earned));
  }

  return checks;
}
