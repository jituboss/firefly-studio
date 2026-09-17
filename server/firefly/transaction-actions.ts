'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import type { Transaction, TransactionSplit } from './types';

/** E5-06 … E5-10 — the transaction write path. */

export interface TransactionFormState {
  error?: string;
  ok?: boolean;
}

export interface SplitInput {
  description: string;
  amount: string;
  source_name: string;
  destination_name: string;
  category_name: string;
  budget_name: string;
  bill_name: string;
  tags: string;
  notes: string;
  foreign_amount: string;
  foreign_currency_code: string;
  reconciled: boolean;
}

/**
 * Firefly rejects `null` for most optional string fields but accepts their
 * absence, so anything blank is dropped rather than sent empty.
 */
function compact<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  );
}

/** Read the repeated split fields the form posts as `splits[N][field]`. */
function readSplits(formData: FormData, type: string, date: string, currency: string) {
  const indices = new Set<number>();
  for (const key of formData.keys()) {
    const match = /^splits\[(\d+)]/.exec(key);
    if (match?.[1]) indices.add(Number.parseInt(match[1], 10));
  }

  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => {
      const field = (name: string) => {
        const value = formData.get(`splits[${index}][${name}]`);
        return typeof value === 'string' ? value.trim() : '';
      };

      const tags = field('tags')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      return compact({
        type,
        date,
        description: field('description'),
        amount: field('amount'),
        currency_code: currency,
        source_name: field('source_name'),
        destination_name: field('destination_name'),
        category_name: field('category_name'),
        budget_name: field('budget_name'),
        bill_name: field('bill_name'),
        notes: field('notes'),
        foreign_amount: field('foreign_amount'),
        foreign_currency_code: field('foreign_currency_code'),
        internal_reference: field('internal_reference'),
        ...(tags.length > 0 ? { tags } : {}),
        reconciled: formData.get(`splits[${index}][reconciled]`) === 'on',
      });
    })
    .filter((split) => split.description && split.amount);
}

function buildPayload(formData: FormData) {
  const type = String(formData.get('type') ?? 'withdrawal');
  const date = String(formData.get('date') ?? '');
  const time = String(formData.get('time') ?? '');
  const currency = String(formData.get('currency_code') ?? 'EUR');
  const groupTitle = String(formData.get('group_title') ?? '').trim();

  // Firefly takes an ISO-8601 datetime; a bare date is midnight in its own zone.
  const stamp = time ? `${date}T${time}:00` : date;

  const splits = readSplits(formData, type, stamp, currency);

  return {
    payload: compact({
      // A group title only applies when there is more than one split.
      group_title: splits.length > 1 ? groupTitle : '',
      transactions: splits,
    }),
    splitCount: splits.length,
  };
}

export async function createTransactionAction(
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const { payload, splitCount } = buildPayload(formData);
  if (splitCount === 0) {
    return { error: 'Add at least one split with a description and an amount.' };
  }

  let created: { data: Transaction };
  try {
    created = await fireflyWrite<{ data: Transaction }>('/v1/transactions', 'POST', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  redirect(`/transactions/${created.data.id}`);
}

export async function updateTransactionAction(
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing transaction id.' };

  const { payload, splitCount } = buildPayload(formData);
  if (splitCount === 0) {
    return { error: 'Add at least one split with a description and an amount.' };
  }

  try {
    await fireflyWrite(`/v1/transactions/${id}`, 'PUT', payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/transactions');
  revalidatePath(`/transactions/${id}`);
  revalidatePath('/dashboard');
  redirect(`/transactions/${id}`);
}

export async function deleteTransactionAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await fireflyWrite(`/v1/transactions/${id}`, 'DELETE');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  redirect('/transactions?deleted=1');
}

/** E5-15 — flip the reconciled flag on a single split. */
export async function setReconciledAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const journalId = String(formData.get('journalId') ?? '');
  const reconciled = formData.get('reconciled') === 'true';
  if (!id || !journalId) return;

  await fireflyWrite(`/v1/transactions/${id}`, 'PUT', {
    transactions: [{ transaction_journal_id: journalId, reconciled }],
  });

  revalidatePath(`/transactions/${id}`);
  revalidatePath('/transactions');
}

/** E5-10 — clone a transaction into the new-transaction form. */
export async function duplicateTransactionAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  redirect(`/transactions/new?from=${encodeURIComponent(id)}`);
}

/** Shape a fetched transaction into the form's split inputs. */
export async function splitsToInputs(splits: TransactionSplit[]): Promise<SplitInput[]> {
  return splits.map((split) => ({
    description: split.description,
    amount: split.amount,
    source_name: split.source_name ?? '',
    destination_name: split.destination_name ?? '',
    category_name: split.category_name ?? '',
    budget_name: split.budget_name ?? '',
    bill_name: split.bill_name ?? '',
    tags: (split.tags ?? []).join(', '),
    notes: split.notes ?? '',
    foreign_amount: split.foreign_amount ?? '',
    foreign_currency_code: split.foreign_currency_code ?? '',
    reconciled: split.reconciled,
  }));
}
