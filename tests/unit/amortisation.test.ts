import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  addMonths,
  buildSchedule,
  monthlyRate,
  typicalPayment,
  yearlySummary,
} from '@/lib/amortisation';

describe('monthlyRate', () => {
  it('divides a yearly rate by twelve', () => {
    expect(monthlyRate('6', 'yearly').toString()).toBe('0.005');
    expect(monthlyRate('6', null).toString()).toBe('0.005');
  });

  it('takes a monthly rate as it is', () => {
    expect(monthlyRate('1.5', 'monthly').toString()).toBe('0.015');
  });

  it('compounds a daily rate up to a month', () => {
    const rate = monthlyRate('0.1', 'daily');
    // (1.001)^(365/12) - 1 ≈ 3.088 %
    expect(rate.toDecimalPlaces(5).toString()).toBe('0.03087');
  });

  it('treats a missing or zero rate as interest-free', () => {
    expect(monthlyRate(null, 'yearly').isZero()).toBe(true);
    expect(monthlyRate('0', 'yearly').isZero()).toBe(true);
    expect(monthlyRate('-2', 'yearly').isZero()).toBe(true);
  });
});

describe('addMonths', () => {
  it('rolls over year boundaries in both directions', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-09', 0)).toBe('2026-09');
    expect(addMonths('2026-09', 24)).toBe('2028-09');
  });
});

describe('typicalPayment', () => {
  it('is the median, so one overpayment does not drag it', () => {
    expect(typicalPayment(['742.18', '742.18', '5000', '742.18'])).toBe('742.18');
    expect(typicalPayment(['100', '200'])).toBe('150.00');
  });

  it('ignores sign and zeroes, and is null with nothing to go on', () => {
    expect(typicalPayment(['-50', '0', '-50'])).toBe('50.00');
    expect(typicalPayment([])).toBeNull();
    expect(typicalPayment(['0'])).toBeNull();
  });
});

describe('buildSchedule', () => {
  it('matches the textbook annuity: 10,000 at 6 % over 12 months', () => {
    // The exact payment is 860.664…; rounding it UP to the cent means the
    // twelfth payment is slightly smaller and the balance lands on zero.
    // Rounding it down would leave a few cents for a thirteenth month.
    const schedule = buildSchedule({
      balance: '10000',
      rate: monthlyRate('6', 'yearly'),
      payment: '860.67',
      startMonth: '2026-10',
    });
    expect(schedule.status).toBe('ok');
    expect(schedule.months).toBe(12);
    expect(schedule.rows[0]).toEqual({
      month: '2026-10',
      payment: '860.67',
      interest: '50.00',
      principal: '810.67',
      balance: '9189.33',
    });
    expect(schedule.payoffMonth).toBe('2027-09');
    expect(schedule.rows.at(-1)!.balance).toBe('0.00');
    // 327.97 unrounded; per-period rounding to the cent, as a statement does it.
    expect(schedule.totalInterest).toBe('327.96');
  });

  it('rows add up to the totals exactly', () => {
    const schedule = buildSchedule({
      balance: '-157281.52',
      rate: monthlyRate('3.4', 'yearly'),
      payment: '742.18',
      startMonth: '2026-10',
    });
    let paid = new Decimal(0);
    let interest = new Decimal(0);
    let principal = new Decimal(0);
    for (const row of schedule.rows) {
      paid = paid.plus(row.payment);
      interest = interest.plus(row.interest);
      principal = principal.plus(row.principal);
    }
    expect(paid.toFixed(2)).toBe(schedule.totalPaid);
    expect(interest.toFixed(2)).toBe(schedule.totalInterest);
    // Principal repaid is exactly the starting balance — nothing lost to rounding.
    expect(principal.toFixed(2)).toBe('157281.52');
  });

  it('an extra payment shortens the loan and costs less interest', () => {
    const base = { balance: '50000', rate: monthlyRate('5', 'yearly'), startMonth: '2026-10' };
    const plain = buildSchedule({ ...base, payment: '500' });
    const extra = buildSchedule({ ...base, payment: '500', extra: '100' });
    expect(extra.months).toBeLessThan(plain.months);
    expect(new Decimal(extra.totalInterest).lessThan(plain.totalInterest)).toBe(true);
  });

  it('says "never" when the payment does not cover the interest', () => {
    const schedule = buildSchedule({
      balance: '100000',
      rate: monthlyRate('12', 'yearly'),
      payment: '1000',
      startMonth: '2026-10',
    });
    expect(schedule.status).toBe('never');
    expect(schedule.firstInterest).toBe('1000.00');
    expect(schedule.rows).toHaveLength(0);
  });

  it('stops at the horizon rather than running forever', () => {
    const schedule = buildSchedule({
      balance: '100000',
      rate: monthlyRate('12', 'yearly'),
      payment: '1000.01',
      startMonth: '2026-10',
      maxMonths: 24,
    });
    expect(schedule.status).toBe('horizon');
    expect(schedule.months).toBe(24);
    expect(schedule.payoffMonth).toBeNull();
  });

  it('is settled with nothing owed, and interest-free debt is paid off linearly', () => {
    expect(
      buildSchedule({ balance: '0', rate: new Decimal(0), payment: '1', startMonth: '2026-10' })
        .status,
    ).toBe('settled');
    const free = buildSchedule({
      balance: '1000',
      rate: new Decimal(0),
      payment: '300',
      startMonth: '2026-10',
    });
    expect(free.months).toBe(4);
    expect(free.rows.at(-1)!.payment).toBe('100.00');
    expect(free.totalInterest).toBe('0.00');
  });
});

describe('yearlySummary', () => {
  it('groups by calendar year and carries the year-end balance', () => {
    const schedule = buildSchedule({
      balance: '1000',
      rate: new Decimal(0),
      payment: '300',
      startMonth: '2026-11',
    });
    expect(yearlySummary(schedule.rows)).toEqual([
      { year: '2026', paid: '600.00', interest: '0.00', principal: '600.00', balance: '400.00' },
      { year: '2027', paid: '400.00', interest: '0.00', principal: '400.00', balance: '0.00' },
    ]);
  });
});
