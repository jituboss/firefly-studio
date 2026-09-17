'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError, fireflyGet } from './api';
import { add, subtract } from '@/lib/money';
import { now, toApiDate } from '@/lib/date';
import type { PiggyBank } from './types';

/** E9-02 / E9-03 — piggy bank writes. */

export interface PiggyFormState {
  error?: string;
}

function compact(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  );
}

function readForm(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    const text = typeof value === 'string' ? value.trim() : '';
    return text === '' ? null : text;
  };

  return {
    name: get('name'),
    account_id: get('account_id'),
    target_amount: get('target_amount'),
    start_date: get('start_date'),
    target_date: get('target_date'),
    notes: get('notes'),
    currency_code: get('currency_code'),
    active: formData.get('active') === 'on',
  };
}

export async function createPiggyBankAction(
  _prev: PiggyFormState,
  formData: FormData,
): Promise<PiggyFormState> {
  const input = readForm(formData);
  if (!input.name || !input.account_id || !input.target_amount) {
    return { error: 'Name, account and target amount are required.' };
  }

  const payload = compact({
    name: input.name,
    target_amount: input.target_amount,
    // Firefly requires `start_date` on creation and answers a bare 422 without
    // it — the single reason piggy-bank creation was failing. The form asks for
    // it; this is the backstop.
    start_date: input.start_date ?? toApiDate(now()),
    target_date: input.target_date,
    notes: input.notes,
    active: input.active,
    // Firefly rejects piggy-bank creation without a currency on the
    // transaction — confirmed against a live instance (422 otherwise).
    transaction_currency_code: input.currency_code ?? 'EUR',
  });
  payload.accounts = [{ account_id: input.account_id, current_amount: '0' }];

  let created: { data: PiggyBank };
  try {
    created = await fireflyWrite<{ data: PiggyBank }>('/v1/piggy-banks', 'POST', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/piggy-banks');
  revalidatePath('/dashboard');
  redirect(`/piggy-banks/${created.data.id}`);
}

export async function updatePiggyBankAction(
  _prev: PiggyFormState,
  formData: FormData,
): Promise<PiggyFormState> {
  const id = String(formData.get('id') ?? '');
  const input = readForm(formData);
  if (!id) return { error: 'Missing piggy bank id.' };
  if (!input.name || !input.target_amount) return { error: 'Name and target amount are required.' };

  const payload = compact({
    name: input.name,
    target_amount: input.target_amount,
    // Firefly requires `start_date` on creation and answers a bare 422 without
    // it — the single reason piggy-bank creation was failing. The form asks for
    // it; this is the backstop.
    start_date: input.start_date ?? toApiDate(now()),
    target_date: input.target_date,
    notes: input.notes,
    active: input.active,
  });

  try {
    await fireflyWrite(`/v1/piggy-banks/${id}`, 'PUT', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/piggy-banks');
  revalidatePath(`/piggy-banks/${id}`);
  revalidatePath('/dashboard');
  return {};
}

export async function deletePiggyBankAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await fireflyWrite(`/v1/piggy-banks/${id}`, 'DELETE');
  revalidatePath('/piggy-banks');
  revalidatePath('/dashboard');
  redirect('/piggy-banks');
}

/**
 * E9-03 — add or remove money.
 *
 * Firefly has no dedicated deposit/withdraw endpoint for a piggy bank: the
 * mechanism is PUT-ing a new `current_amount` on its `accounts` entry. Firefly
 * diffs the old and new amounts server-side and writes the corresponding
 * +/- row to /piggy-banks/{id}/events itself — confirmed against a live
 * instance rather than assumed from the spec.
 */
export async function adjustPiggyBankAction(
  _prev: PiggyFormState,
  formData: FormData,
): Promise<PiggyFormState> {
  const id = String(formData.get('id') ?? '');
  const accountId = String(formData.get('account_id') ?? '');
  const direction = String(formData.get('direction') ?? 'add');
  const amount = String(formData.get('amount') ?? '').trim();

  if (!id || !accountId || !amount) return { error: 'Missing required fields.' };

  let current: { data: PiggyBank };
  try {
    current = await fireflyGet<{ data: PiggyBank }>(`/v1/piggy-banks/${id}`, { noCache: true });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  const account = current.data.attributes.accounts.find((a) => a.account_id === accountId);
  const existing = account?.current_amount ?? '0';
  const nextAmount =
    direction === 'remove'
      ? subtract(existing, amount).toString()
      : add(existing, amount).toString();

  if (direction === 'remove' && subtract(existing, amount).isNegative()) {
    return { error: 'Cannot remove more than the current amount.' };
  }

  try {
    await fireflyWrite(`/v1/piggy-banks/${id}`, 'PUT', {
      accounts: [{ account_id: accountId, current_amount: nextAmount }],
    });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/piggy-banks/${id}`);
  revalidatePath('/piggy-banks');
  revalidatePath('/dashboard');
  return {};
}
