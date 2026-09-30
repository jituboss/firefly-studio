import { describe, expect, it } from 'vitest';
import { validateRequestBody } from '@/server/firefly/request-validation';
import { REQUEST_BODIES } from '@/spec/generated/request-schemas';

/**
 * E1-14 — the proxy's request-body check. The payloads marked "as sent" are
 * copied from what this app's own Server Actions post, which Firefly accepts;
 * a schema that refused them would be wrong, not strict.
 */
describe('validateRequestBody', () => {
  it('covers every JSON request body in the spec', () => {
    expect(REQUEST_BODIES.length).toBeGreaterThanOrEqual(40);
  });

  it('accepts a subscription exactly as the bill form sends it', () => {
    const body = {
      name: 'Electricity',
      amount_min: '40.00',
      amount_max: '60.00',
      currency_code: 'EUR',
      date: '2026-09-01',
      repeat_freq: 'monthly',
      skip: '0', // a string from the form; Firefly takes it
      active: true,
      object_group_title: '',
    };
    expect(validateRequestBody('POST', '/v1/bills', body)).toEqual({ ok: true });
  });

  it('accepts numeric ids where the spec says string, as Firefly does', () => {
    const check = validateRequestBody('PUT', '/v1/bills/33', { object_group_id: 12 });
    expect(check.ok).toBe(true);
  });

  it('lets unknown keys through — the spec trails Firefly', () => {
    const check = validateRequestBody('PUT', '/v1/bills/33', { some_future_field: 1 });
    expect(check.ok).toBe(true);
  });

  it('refuses a missing required field and names it', () => {
    const check = validateRequestBody('POST', '/v1/bills', { name: 'No amounts' });
    expect(check.ok).toBe(false);
    if (!check.ok) {
      const paths = check.issues.map((issue) => issue.path);
      expect(paths).toEqual(expect.arrayContaining(['amount_min', 'amount_max', 'date']));
    }
  });

  it('refuses an enum value Firefly does not have', () => {
    const check = validateRequestBody('PUT', '/v1/bills/33', { repeat_freq: 'fortnightly' });
    expect(check).toMatchObject({ ok: false, issues: [{ path: 'repeat_freq' }] });
  });

  it('refuses a malformed amount', () => {
    const check = validateRequestBody('PUT', '/v1/bills/33', { amount_min: '12,50' });
    expect(check).toMatchObject({ ok: false, issues: [{ path: 'amount_min' }] });
  });

  it('validates nested splits, with a path into the array', () => {
    const check = validateRequestBody('POST', '/v1/transactions', {
      transactions: [
        {
          type: 'withdrawal',
          date: '2026-09-30',
          amount: '12.50',
          description: 'Coffee',
          source_id: '1',
          destination_name: 'Café',
        },
        { type: 'withdrawal', date: '2026-09-30', description: 'No amount' },
      ],
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.issues[0]!.path).toBe('transactions.1.amount');
  });

  it('refuses a wrongly shaped body outright', () => {
    const check = validateRequestBody('POST', '/v1/transactions', { transactions: 'nope' });
    expect(check.ok).toBe(false);
  });

  it('requires a body where the spec does, and passes paths it has no schema for', () => {
    expect(validateRequestBody('POST', '/v1/bills', undefined).ok).toBe(false);
    expect(validateRequestBody('POST', '/v1/rules/1/trigger', undefined).ok).toBe(true);
    expect(validateRequestBody('GET', '/v1/bills', undefined).ok).toBe(true);
  });

  it('caps the issue list', () => {
    const check = validateRequestBody('POST', '/v1/transactions', {
      transactions: Array.from({ length: 30 }, () => ({})),
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.issues.length).toBeLessThanOrEqual(10);
  });
});
