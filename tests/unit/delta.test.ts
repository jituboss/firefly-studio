import { describe, expect, it } from 'vitest';
import { computeDelta, isImprovement } from '@/lib/delta';

/**
 * E21-02 — these pin the bug this module was extracted to fix.
 *
 * The dashboard compared signed values while the tile rendered a magnitude.
 * Firefly reports spending as negative, so a period where spending FELL
 * displayed "Spent ↑ 48.7%" in green: the arrow disagreed with the colour and
 * both disagreed with the ledger.
 */
describe('computeDelta', () => {
  // The exact figures from the live ledger that exposed it.
  it('reads falling spending as DOWN, not up, when the values are negative', () => {
    const signed = computeDelta('-5425.68', '-10574.32', 'value');
    const magnitude = computeDelta('-5425.68', '-10574.32', 'magnitude');

    // Signed arithmetic says the number rose: -10574 -> -5425 is an increase.
    expect(signed.direction).toBe('up');
    // The tile shows |5425.68| against |10574.32|, which fell by half.
    expect(magnitude.direction).toBe('down');
    expect(magnitude.percent).toBeCloseTo(-48.7, 1);
  });

  it('is unchanged by sign for a magnitude comparison', () => {
    expect(computeDelta('-300', '-200', 'magnitude').direction).toBe('up');
    expect(computeDelta('300', '200', 'magnitude').direction).toBe('up');
  });

  // Net worth is meaningful signed: -100 -> -50 is an improvement, and
  // comparing magnitudes would call it a 50% fall.
  it('keeps signed comparison for values that are meaningful negative', () => {
    const result = computeDelta('-50', '-100', 'value');
    expect(result.direction).toBe('up');
    expect(result.percent).toBeCloseTo(50, 5);
  });

  it('computes an ordinary rise and fall', () => {
    expect(computeDelta('150', '100').percent).toBeCloseTo(50, 5);
    expect(computeDelta('50', '100').percent).toBeCloseTo(-50, 5);
  });

  it('reports no comparison rather than infinity against a zero baseline', () => {
    expect(computeDelta('100', '0')).toEqual({ percent: null, direction: 'none' });
  });

  it('reports no comparison when there is no previous period', () => {
    expect(computeDelta('100', undefined)).toEqual({ percent: null, direction: 'none' });
  });

  it('treats a rounding-level change as unchanged', () => {
    expect(computeDelta('100.01', '100').direction).toBe('flat');
  });

  // Money is a string end to end; this must not be coerced through a float.
  it('accepts the decimal strings Firefly returns', () => {
    expect(computeDelta('1234.56', '1000.00').percent).toBeCloseTo(23.456, 3);
  });
});

describe('isImprovement', () => {
  it('knows that spending more is not an improvement', () => {
    expect(isImprovement('up', 'lower')).toBe(false);
    expect(isImprovement('down', 'lower')).toBe(true);
  });

  it('knows that earning more is', () => {
    expect(isImprovement('up', 'higher')).toBe(true);
    expect(isImprovement('down', 'higher')).toBe(false);
  });

  it('does not colour a flat or absent change as a failure', () => {
    expect(isImprovement('flat', 'higher')).toBe(true);
    expect(isImprovement('none', 'lower')).toBe(true);
  });
});
