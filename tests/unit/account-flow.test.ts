import { describe, expect, it } from 'vitest';
import { accountFlowTotals, splitEffect, splitFlow } from '@/lib/account-flow';
import type { TransactionSplit } from '@/server/firefly/types';

const CARD = '222';
const CHECKING = '104';

function split(overrides: Partial<TransactionSplit> = {}): TransactionSplit {
  return {
    transaction_journal_id: '1',
    type: 'withdrawal',
    date: '2026-09-15T00:00:00+00:00',
    amount: '100.00',
    currency_code: 'EUR',
    currency_symbol: '€',
    currency_decimal_places: 2,
    foreign_amount: null,
    foreign_currency_code: null,
    description: 'Something',
    source_id: CARD,
    source_name: 'EBL Visa',
    source_type: 'Debt',
    destination_id: '300',
    destination_name: 'A shop',
    destination_type: 'Expense account',
    category_id: null,
    category_name: null,
    budget_id: null,
    budget_name: null,
    bill_id: null,
    bill_name: null,
    tags: null,
    notes: null,
    reconciled: false,
    internal_reference: null,
    external_url: null,
    ...overrides,
  };
}

/**
 * The case the whole module exists for, taken from a live instance.
 *
 * Firefly allows ASSET → DEBT for a withdrawal and allows no transfer between
 * them at all (`config('firefly.source_dests')`), so a credit card's own
 * transaction list holds two withdrawals that move money in OPPOSITE
 * directions. Classifying by transaction type cannot tell them apart.
 */
const CARD_PAYMENT = split({
  transaction_journal_id: '10',
  type: 'withdrawal',
  amount: '168000.00',
  description: 'EBL Visa credit card payment',
  source_id: CHECKING,
  source_name: 'Everyday Current',
  source_type: 'Asset account',
  destination_id: CARD,
  destination_name: 'EBL Visa',
  destination_type: 'Debt',
});

const CARD_PURCHASE = split({
  transaction_journal_id: '11',
  amount: '3653.00',
  description: 'Purchase from FIRSTTRIP',
});

describe('splitFlow', () => {
  it('reads a card payment as money INTO the card, though it is a withdrawal', () => {
    const flow = splitFlow(CARD_PAYMENT, CARD, 'EUR');
    expect(flow.direction).toBe(1);
    expect(flow.magnitude.toString()).toBe('168000');
  });

  it('reads the same split as money OUT of the account that paid it', () => {
    expect(splitFlow(CARD_PAYMENT, CHECKING, 'EUR').direction).toBe(-1);
  });

  it('reads a purchase on the card as money out of the card', () => {
    expect(splitFlow(CARD_PURCHASE, CARD, 'EUR').direction).toBe(-1);
  });

  it('ignores a split that does not touch the account', () => {
    const elsewhere = split({ source_id: '999', destination_id: '888' });
    expect(splitFlow(elsewhere, CARD, 'EUR')).toMatchObject({ direction: 0, unconvertible: false });
  });

  it('counts a transfer, which has a direction like anything else', () => {
    const out = split({ type: 'transfer', source_id: CARD, destination_id: CHECKING });
    const into = split({ type: 'transfer', source_id: CHECKING, destination_id: CARD });
    expect(splitFlow(out, CARD, 'EUR').direction).toBe(-1);
    expect(splitFlow(into, CARD, 'EUR').direction).toBe(1);
  });

  it('uses the foreign amount when that is the side in our currency', () => {
    const fx = split({
      amount: '120.00',
      currency_code: 'USD',
      foreign_amount: '101.50',
      foreign_currency_code: 'EUR',
    });
    expect(splitFlow(fx, CARD, 'EUR').magnitude.toString()).toBe('101.5');
  });

  it('reports a third currency rather than counting it as zero silently', () => {
    const fx = split({ amount: '120.00', currency_code: 'USD' });
    expect(splitFlow(fx, CARD, 'EUR')).toMatchObject({ unconvertible: true });
    expect(splitFlow(fx, CARD, 'EUR').magnitude.toString()).toBe('0');
  });

  it('takes direction from the accounts even if the amount arrives signed', () => {
    expect(splitFlow(split({ amount: '-100.00' }), CARD, 'EUR').magnitude.toString()).toBe('100');
  });
});

describe('accountFlowTotals', () => {
  it('gets the credit-card month right', () => {
    // The reported bug: both rows are withdrawals, and counting both as
    // spending reported out 171,653 / net -171,653 for a month that ran
    // 168,000 in and 3,653 out.
    expect(accountFlowTotals([CARD_PAYMENT, CARD_PURCHASE], CARD, 'EUR')).toEqual({
      inflow: '168000',
      outflow: '3653',
      net: '164347',
      unconvertible: 0,
    });
  });

  it('gives the mirror answer for the account that paid', () => {
    expect(accountFlowTotals([CARD_PAYMENT], CHECKING, 'EUR')).toMatchObject({
      inflow: '0',
      outflow: '168000',
      net: '-168000',
    });
  });

  it('is empty when nothing touches the account', () => {
    const elsewhere = split({ source_id: '999', destination_id: '888' });
    expect(accountFlowTotals([elsewhere], CARD, 'EUR')).toEqual({
      inflow: '0',
      outflow: '0',
      net: '0',
      unconvertible: 0,
    });
  });

  it('counts transfers, unlike the whole-ledger totals', () => {
    const into = split({
      type: 'transfer',
      amount: '500',
      source_id: CHECKING,
      destination_id: CARD,
    });
    expect(accountFlowTotals([into], CARD, 'EUR').inflow).toBe('500');
  });

  it('counts an opening balance, which is a real movement of the account', () => {
    const opening = split({
      type: 'opening balance',
      amount: '1000',
      source_id: '500',
      destination_id: CARD,
    });
    expect(accountFlowTotals([opening], CARD, 'EUR').inflow).toBe('1000');
  });

  it('reports what it could not convert instead of under-counting in silence', () => {
    const fx = split({ amount: '120.00', currency_code: 'USD' });
    const totals = accountFlowTotals([CARD_PURCHASE, fx], CARD, 'EUR');
    expect(totals.outflow).toBe('3653');
    expect(totals.unconvertible).toBe(1);
  });

  it('sums at full precision rather than rounding each split', () => {
    const pennies = Array.from({ length: 3 }, (_, index) =>
      split({ transaction_journal_id: `p${index}`, amount: '0.005' }),
    );
    // Rounded per split this would be 0.00 or 0.03; summed first it is 0.015.
    expect(accountFlowTotals(pennies, CARD, 'EUR').outflow).toBe('0.015');
  });
});

describe('splitEffect', () => {
  it('still returns the rounded signed string reconciliation relies on', () => {
    expect(splitEffect(CARD_PURCHASE, CARD, 'EUR')).toEqual({
      effect: '-3653.00',
      amount: '3653.00',
      unconvertible: false,
    });
  });

  it('is positive for a payment into the card', () => {
    expect(splitEffect(CARD_PAYMENT, CARD, 'EUR').effect).toBe('168000.00');
  });

  it('honours a currency that is not carried to two places', () => {
    const bhd = split({ amount: '10.125', currency_code: 'BHD' });
    expect(splitEffect(bhd, CARD, 'BHD', 3).effect).toBe('-10.125');
  });
});
