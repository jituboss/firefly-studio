'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import type { Budget, BudgetLimit } from './types';

/** E6-02 / E6-03 — budget and budget-limit writes. */

export interface BudgetFormState {
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
    notes: get('notes'),
    active: formData.get('active') === 'on',
    auto_budget_type: get('auto_budget_type'),
    auto_budget_amount: get('auto_budget_amount'),
    auto_budget_period: get('auto_budget_period'),
    auto_budget_currency_code: get('auto_budget_currency_code'),
  };
}

export async function createBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const input = readForm(formData);
  if (!input.name) return { error: 'Name is required.' };

  const payload = compact({
    ...input,
    // Firefly rejects auto_budget_amount/period when the type is "none".
    ...(input.auto_budget_type && input.auto_budget_type !== 'none'
      ? {}
      : { auto_budget_type: null, auto_budget_amount: null, auto_budget_period: null }),
  });

  let created: { data: Budget };
  try {
    created = await fireflyWrite<{ data: Budget }>('/v1/budgets', 'POST', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/budgets');
  revalidatePath('/dashboard');
  redirect(`/budgets/${created.data.id}`);
}

export async function updateBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const id = String(formData.get('id') ?? '');
  const input = readForm(formData);
  if (!id) return { error: 'Missing budget id.' };
  if (!input.name) return { error: 'Name is required.' };

  const payload = compact({
    ...input,
    ...(input.auto_budget_type && input.auto_budget_type !== 'none'
      ? {}
      : { auto_budget_type: null, auto_budget_amount: null, auto_budget_period: null }),
  });

  try {
    await fireflyWrite(`/v1/budgets/${id}`, 'PUT', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/budgets');
  revalidatePath(`/budgets/${id}`);
  revalidatePath('/dashboard');
  return {};
}

export async function deleteBudgetAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await fireflyWrite(`/v1/budgets/${id}`, 'DELETE');
  revalidatePath('/budgets');
  revalidatePath('/dashboard');
  redirect('/budgets');
}

/** E6-03 — create or update a budget limit for a period. */
export async function saveBudgetLimitAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const budgetId = String(formData.get('budget_id') ?? '');
  const limitId = String(formData.get('limit_id') ?? '');
  const start = String(formData.get('start') ?? '');
  const end = String(formData.get('end') ?? '');
  const amount = String(formData.get('amount') ?? '');
  const currencyCode = String(formData.get('currency_code') ?? 'EUR');

  if (!budgetId || !start || !end || !amount) {
    return { error: 'Start, end and amount are required.' };
  }

  try {
    if (limitId) {
      await fireflyWrite<{ data: BudgetLimit }>(
        `/v1/budgets/${budgetId}/limits/${limitId}`,
        'PUT',
        { start, end, amount, currency_code: currencyCode },
      );
    } else {
      await fireflyWrite<{ data: BudgetLimit }>(`/v1/budgets/${budgetId}/limits`, 'POST', {
        start,
        end,
        amount,
        currency_code: currencyCode,
      });
    }
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/budgets/${budgetId}`);
  revalidatePath('/dashboard');
  return {};
}

export async function deleteBudgetLimitAction(formData: FormData): Promise<void> {
  const budgetId = String(formData.get('budget_id') ?? '');
  const limitId = String(formData.get('limit_id') ?? '');
  if (!budgetId || !limitId) return;

  await fireflyWrite(`/v1/budgets/${budgetId}/limits/${limitId}`, 'DELETE');
  revalidatePath(`/budgets/${budgetId}`);
}

export interface BulkBudgetState {
  error?: string;
  ok?: boolean;
}

/** E6-05 — bulk-assign a budget to selected transactions from the without-budget page. */
export async function bulkSetBudgetAction(
  _prev: BulkBudgetState,
  formData: FormData,
): Promise<BulkBudgetState> {
  const budgetName = String(formData.get('budget_name') ?? '').trim();
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (!budgetName) return { error: 'Pick or type a budget.' };
  if (ids.length === 0) return { error: 'Select at least one transaction.' };

  try {
    await Promise.all(
      ids.map((id) =>
        fireflyWrite(`/v1/transactions/${id}`, 'PUT', {
          transactions: [{ budget_name: budgetName }],
        }),
      ),
    );
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/budgets/transactions-without-budget');
  revalidatePath('/budgets');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { ok: true };
}
