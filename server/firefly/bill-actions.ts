'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import type { Bill } from './types';

/** E8-02 — bill (subscription) writes. */

export interface BillFormState {
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
    amount_min: get('amount_min'),
    amount_max: get('amount_max'),
    currency_code: get('currency_code'),
    date: get('date'),
    end_date: get('end_date'),
    extension_date: get('extension_date'),
    repeat_freq: get('repeat_freq'),
    skip: get('skip'),
    notes: get('notes'),
    active: formData.get('active') === 'on',
  };
}

export async function createBillAction(
  _prev: BillFormState,
  formData: FormData,
): Promise<BillFormState> {
  const input = readForm(formData);
  if (!input.name || !input.amount_min || !input.amount_max || !input.date) {
    return { error: 'Name, amount range and date are required.' };
  }

  let created: { data: Bill };
  try {
    created = await fireflyWrite<{ data: Bill }>('/v1/bills', 'POST', compact(input));
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  redirect(`/bills/${created.data.id}`);
}

export async function updateBillAction(
  _prev: BillFormState,
  formData: FormData,
): Promise<BillFormState> {
  const id = String(formData.get('id') ?? '');
  const input = readForm(formData);
  if (!id) return { error: 'Missing bill id.' };
  if (!input.name || !input.amount_min || !input.amount_max || !input.date) {
    return { error: 'Name, amount range and date are required.' };
  }

  try {
    await fireflyWrite(`/v1/bills/${id}`, 'PUT', compact(input));
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/bills');
  revalidatePath(`/bills/${id}`);
  revalidatePath('/dashboard');
  return {};
}

export async function deleteBillAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await fireflyWrite(`/v1/bills/${id}`, 'DELETE');
  revalidatePath('/bills');
  revalidatePath('/dashboard');
  redirect('/bills');
}
