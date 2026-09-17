'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import type { Account } from './types';

/** E4-04 / E4-05 — account writes. */

export interface AccountFormState {
  error?: string;
}

function readForm(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    const text = typeof value === 'string' ? value.trim() : '';
    return text === '' ? null : text;
  };

  return {
    name: get('name'),
    type: get('type'),
    account_role: get('account_role'),
    currency_code: get('currency_code'),
    opening_balance: get('opening_balance'),
    opening_balance_date: get('opening_balance_date'),
    virtual_balance: get('virtual_balance'),
    iban: get('iban'),
    bic: get('bic'),
    account_number: get('account_number'),
    notes: get('notes'),
    active: formData.get('active') === 'on',
    include_net_worth: formData.get('include_net_worth') === 'on',
    credit_card_type: get('credit_card_type'),
    monthly_payment_date: get('monthly_payment_date'),
    liability_type: get('liability_type'),
    liability_direction: get('liability_direction'),
    interest: get('interest'),
    interest_period: get('interest_period'),
  };
}

/** Firefly rejects unknown/empty fields, so send only what is set. */
function compact(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined),
  );
}

function buildPayload(input: ReturnType<typeof readForm>): Record<string, unknown> {
  const isAsset = input.type === 'asset';
  const role = isAsset ? (input.account_role ?? 'defaultAsset') : null;

  return compact({
    ...input,
    account_role: role,
    // Firefly makes both of these mandatory for the credit-card role, and
    // rejects them for every other role.
    credit_card_type: role === 'ccAsset' ? (input.credit_card_type ?? 'monthlyFull') : null,
    monthly_payment_date:
      role === 'ccAsset'
        ? (input.monthly_payment_date ?? new Date().toISOString().slice(0, 10))
        : null,
  });
}

export async function createAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const input = readForm(formData);
  if (!input.name || !input.type) return { error: 'Name and type are required.' };

  try {
    const created = await fireflyWrite<{ data: Account }>(
      '/v1/accounts',
      'POST',
      buildPayload(input),
    );
    revalidatePath('/accounts');
    revalidatePath('/dashboard');
    redirect(`/accounts/${created.data.id}`);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    // `redirect()` throws by design — let it through.
    throw error;
  }
}

export async function updateAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const id = String(formData.get('id') ?? '');
  const input = readForm(formData);
  if (!id) return { error: 'Missing account id.' };
  if (!input.name) return { error: 'Name is required.' };

  try {
    await fireflyWrite(`/v1/accounts/${id}`, 'PUT', buildPayload(input));
    revalidatePath('/accounts');
    revalidatePath(`/accounts/${id}`);
    revalidatePath('/dashboard');
    return {};
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await fireflyWrite(`/v1/accounts/${id}`, 'DELETE');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  redirect('/accounts');
}
