'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import { getTransaction } from './queries';
import type { Transaction, TransactionSplit } from './types';
import {
  buildConversionPayload,
  conversionApplied,
  planConversion,
  type TransactionType,
} from '@/lib/transaction-convert';

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

/**
 * E5-19 — convert a transaction between withdrawal, deposit and transfer.
 *
 * The interesting part is the check at the end. Firefly answers **200 OK** to a
 * conversion it did not perform — send `type` without a valid counter-account
 * and the response is a success carrying the original type. Reporting that as
 * done is worse than failing: the user sees "Converted to transfer", goes back
 * to a list still showing an expense, and concludes the app is lying. Which it
 * would be.
 *
 * The rules this relies on are in lib/transaction-convert.ts, together with
 * what each one cost to find out.
 */
export async function convertTransactionAction(
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const id = String(formData.get('id') ?? '');
  const to = String(formData.get('to') ?? '') as TransactionType;
  const accountId = String(formData.get('accountId') ?? '').trim();
  const accountName = String(formData.get('accountName') ?? '').trim();

  if (!id) return { error: 'Missing transaction id.' };
  if (!accountId && !accountName) {
    return { error: 'Choose the account on the other side of this transaction.' };
  }

  let group: Transaction;
  try {
    /*
     * Re-read rather than trusting the form. The payload must carry EVERY
     * split — omitting one deletes it — and the browser only ever held the one
     * the user was looking at. A stale hidden field here destroys data.
     */
    group = (await getTransaction(id)).data;
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  const splits = group.attributes.transactions;
  const first = splits[0];
  if (!first) return { error: 'This transaction has no splits to convert.' };

  const plan = planConversion(first, to);
  if (plan === null)
    return { error: `This is already ${to === 'deposit' ? 'income' : `a ${to}`}.` };
  if ('error' in plan) return { error: plan.error };

  const payload = buildConversionPayload(
    splits,
    plan,
    to,
    { ...(accountId ? { id: accountId } : {}), name: accountName },
    group.attributes.group_title ?? null,
  );

  let updated: Transaction;
  try {
    updated = (await fireflyWrite<{ data: Transaction }>(`/v1/transactions/${id}`, 'PUT', payload))
      .data;
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  // The 200 means nothing on its own. See the module comment.
  if (!conversionApplied(updated.attributes.transactions, to)) {
    return {
      error:
        'Firefly accepted the change but the transaction is unchanged. That usually means the account on the other side is not the kind this type needs — an expense account for a spend, a revenue account for income, one of your own accounts for a transfer.',
    };
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

// --- E5-11 — bulk operations -------------------------------------------------

export interface BulkTransactionState {
  error?: string;
  notice?: string;
  ok?: boolean;
}

/**
 * Apply one field to every selected transaction group.
 *
 * Firefly has no batch-update endpoint, so this is N PUTs. They run in
 * parallel, but `allSettled` rather than `all`: with `all`, one 422 on the
 * seventh of twenty would reject while the other nineteen still applied, and
 * the user would be told it failed with no idea what actually changed. This
 * reports exactly how many succeeded.
 *
 * Only ONE field is sent per call, and a Firefly PUT to `transactions` merges
 * rather than replaces, so setting a category does not clear the budget.
 */
export async function bulkUpdateTransactionsAction(
  _prev: BulkTransactionState,
  formData: FormData,
): Promise<BulkTransactionState> {
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) return { error: 'Select at least one transaction.' };

  const field = String(formData.get('field') ?? '');
  const value = String(formData.get('value') ?? '').trim();

  const payload: Record<string, unknown> = {};
  switch (field) {
    case 'category':
      // An empty value clears the assignment, which is a legitimate bulk edit.
      payload.category_name = value;
      break;
    case 'budget':
      payload.budget_name = value;
      break;
    case 'tags': {
      const tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (tags.length === 0) return { error: 'Enter at least one tag.' };
      payload.tags = tags;
      break;
    }
    default:
      return { error: 'Unknown field.' };
  }

  const results = await Promise.allSettled(
    ids.map((id) => fireflyWrite(`/v1/transactions/${id}`, 'PUT', { transactions: [payload] })),
  );

  const failed = results.filter((result) => result.status === 'rejected');

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/reports');

  if (failed.length === results.length) {
    const first = failed[0];
    const reason =
      first && first.status === 'rejected' && first.reason instanceof FireflyRequestError
        ? first.reason.message
        : 'Firefly rejected the change.';
    return { error: reason };
  }

  if (failed.length > 0) {
    return {
      ok: true,
      notice: `Updated ${results.length - failed.length} of ${results.length}. ${failed.length} failed.`,
    };
  }

  return { ok: true, notice: `Updated ${results.length}.` };
}

/** E5-11 — delete every selected group. Same all-or-partial reporting. */
export async function bulkDeleteTransactionsAction(
  _prev: BulkTransactionState,
  formData: FormData,
): Promise<BulkTransactionState> {
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) return { error: 'Select at least one transaction.' };

  const results = await Promise.allSettled(
    ids.map((id) => fireflyWrite(`/v1/transactions/${id}`, 'DELETE')),
  );
  const failed = results.filter((result) => result.status === 'rejected').length;

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/reports');

  if (failed === results.length) return { error: 'Firefly refused to delete these.' };
  return {
    ok: true,
    notice:
      failed > 0
        ? `Deleted ${results.length - failed} of ${results.length}. ${failed} failed.`
        : `Deleted ${results.length}.`,
  };
}

// --- E5-13 — quick add -------------------------------------------------------

export interface QuickAddState {
  error?: string;
  notice?: string;
  ok?: boolean;
}

/**
 * Record one simple transaction without leaving the list.
 *
 * Deliberately narrow: a description, an amount, two account names and an
 * optional category. Anything with splits, a foreign amount or attachments
 * belongs in the full form — a quick-add that grows fields until it is the full
 * form is just a worse copy of it.
 *
 * Stays on the page rather than redirecting to the new transaction, because the
 * point is entering several in a row.
 */
export async function quickAddTransactionAction(
  _prev: QuickAddState,
  formData: FormData,
): Promise<QuickAddState> {
  const description = String(formData.get('description') ?? '').trim();
  const amount = String(formData.get('amount') ?? '').trim();
  const type = String(formData.get('type') ?? 'withdrawal');
  const source = String(formData.get('source_name') ?? '').trim();
  const destination = String(formData.get('destination_name') ?? '').trim();
  const category = String(formData.get('category_name') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();

  if (!description) return { error: 'Add a description.' };
  if (!amount || !/^\d+([.,]\d+)?$/.test(amount)) {
    return { error: 'Enter an amount, digits only.' };
  }
  if (!source || !destination) return { error: 'Name both accounts.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Pick a date.' };

  const split: Record<string, unknown> = {
    type,
    date,
    description,
    // Firefly wants a dot decimal separator regardless of locale.
    amount: amount.replace(',', '.'),
    source_name: source,
    destination_name: destination,
  };
  if (category) split.category_name = category;

  try {
    await fireflyWrite('/v1/transactions', 'POST', {
      error_if_duplicate_hash: false,
      apply_rules: true,
      transactions: [split],
    });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
  return { ok: true, notice: `Added “${description}”.` };
}
