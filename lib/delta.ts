import { divide, subtract, toDecimal, type MoneyInput } from '@/lib/money';

/**
 * E21-02 — period-over-period change, as arithmetic rather than as a component.
 *
 * Extracted so the part that was wrong is the part that is tested. The
 * dashboard's hand-rolled version compared signed values while the tile above
 * it rendered a magnitude, and Firefly reports spending as negative — so a
 * period where spending FELL displayed "Spent ↑ 48.7%" in green. The arrow
 * disagreed with the colour and both disagreed with the ledger.
 */
export type DeltaCompare = 'value' | 'magnitude';

export interface DeltaResult {
  /** Percentage change, signed. Null when there is nothing to compare against. */
  percent: number | null;
  direction: 'up' | 'down' | 'flat' | 'none';
}

/** Below this, a change is noise and is reported as unchanged. */
const FLAT_THRESHOLD = 0.05;

export function computeDelta(
  current: MoneyInput,
  previous: MoneyInput | undefined,
  compare: DeltaCompare = 'value',
): DeltaResult {
  if (previous === undefined) return { percent: null, direction: 'none' };

  const base = compare === 'magnitude' ? toDecimal(previous).abs() : toDecimal(previous);
  const now = compare === 'magnitude' ? toDecimal(current).abs() : toDecimal(current);

  // Every change from zero is infinite, and "+∞%" is not actionable.
  if (base.isZero()) return { percent: null, direction: 'none' };

  const change = divide(subtract(now, base), base.abs()).times(100);
  if (change.abs().lessThan(FLAT_THRESHOLD)) return { percent: 0, direction: 'flat' };

  return {
    percent: change.toNumber(),
    direction: change.isNegative() ? 'down' : 'up',
  };
}

/** Whether a movement is an improvement — which arithmetic cannot decide. */
export function isImprovement(
  direction: DeltaResult['direction'],
  betterWhen: 'higher' | 'lower',
): boolean {
  if (direction === 'up') return betterWhen === 'higher';
  if (direction === 'down') return betterWhen === 'lower';
  return true;
}
