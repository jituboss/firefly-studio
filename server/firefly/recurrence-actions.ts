'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import type { Recurrence } from './types';

/** E10-02 / E10-04 — recurring transaction writes. */

export interface RecurrenceFormState {
  error?: string;
}

/**
 * Firefly requires EXACTLY ONE of `nr_of_repetitions` and `repeat_until`.
 * Sending neither is a 422 ("Require either a number of repetitions, or an end
 * date (repeat_until). Not both.") and so is sending both — the same message
 * for opposite mistakes. There is therefore no "runs forever" recurrence to
 * offer, however natural it feels: the form picks one of the two and the
 * payload carries only that one.
 */
type EndMode = 'count' | 'date';

function readPayload(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const type = String(formData.get('type') ?? 'withdrawal');
  const firstDate = String(formData.get('first_date') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  const endMode = String(formData.get('end_mode') ?? 'count') as EndMode;
  const repetitionsCount = String(formData.get('nr_of_repetitions') ?? '').trim();
  const repeatUntil = String(formData.get('repeat_until') ?? '').trim();

  const repetitionType = String(formData.get('repetition_type') ?? 'monthly');
  const moment = String(formData.get('moment') ?? '').trim();
  const skip = String(formData.get('skip') ?? '0').trim();
  const weekend = String(formData.get('weekend') ?? '1').trim();

  const amount = String(formData.get('amount') ?? '').trim();
  const sourceId = String(formData.get('source_id') ?? '').trim();
  const destinationId = String(formData.get('destination_id') ?? '').trim();
  const currencyCode = String(formData.get('currency_code') ?? '').trim();
  const categoryName = String(formData.get('category_name') ?? '').trim();
  const budgetId = String(formData.get('budget_id') ?? '').trim();
  const tags = String(formData.get('tags') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    title,
    firstDate,
    amount,
    sourceId,
    destinationId,
    endMode,
    repetitionsCount,
    repeatUntil,
    payload: {
      type,
      title,
      description: description || title,
      first_date: firstDate,
      apply_rules: formData.get('apply_rules') !== 'off',
      active: formData.get('active') !== 'off',
      ...(notes ? { notes } : {}),
      // Exactly one, never both, never neither.
      ...(endMode === 'date'
        ? { repeat_until: repeatUntil }
        : { nr_of_repetitions: repetitionsCount }),
      repetitions: [
        {
          type: repetitionType,
          // `moment` means a different thing per type: day-of-month for
          // monthly, weekday for weekly, "2,3" for nth-day-of-month. Firefly
          // accepts an empty string for daily, which has no moment at all.
          moment: repetitionType === 'daily' ? '' : moment,
          skip: skip,
          weekend: weekend,
        },
      ],
      transactions: [
        {
          description: description || title,
          amount,
          source_id: sourceId,
          destination_id: destinationId,
          ...(currencyCode ? { currency_code: currencyCode } : {}),
          ...(categoryName ? { category_name: categoryName } : {}),
          ...(budgetId ? { budget_id: budgetId } : {}),
          ...(tags.length > 0 ? { tags } : {}),
        },
      ],
    },
  };
}

function validate(parsed: ReturnType<typeof readPayload>): string | null {
  if (!parsed.title) return 'Give this a name.';
  if (!parsed.firstDate) return 'Pick the first date it should happen.';
  if (!parsed.amount) return 'Enter an amount.';
  if (!parsed.sourceId || !parsed.destinationId) return 'Pick both accounts.';
  if (parsed.endMode === 'count' && !parsed.repetitionsCount) {
    return 'Say how many times it should repeat.';
  }
  if (parsed.endMode === 'date' && !parsed.repeatUntil) return 'Pick the date it should stop.';
  return null;
}

export async function createRecurrenceAction(
  _prev: RecurrenceFormState,
  formData: FormData,
): Promise<RecurrenceFormState> {
  const parsed = readPayload(formData);
  const problem = validate(parsed);
  if (problem) return { error: problem };

  let created: { data: Recurrence };
  try {
    created = await fireflyWrite<{ data: Recurrence }>('/v1/recurrences', 'POST', parsed.payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/recurring');
  redirect(`/recurring/${created.data.id}`);
}

export async function updateRecurrenceAction(
  _prev: RecurrenceFormState,
  formData: FormData,
): Promise<RecurrenceFormState> {
  const id = String(formData.get('id') ?? '');
  const parsed = readPayload(formData);
  if (!id) return { error: 'Missing recurrence.' };
  const problem = validate(parsed);
  if (problem) return { error: problem };

  try {
    await fireflyWrite(`/v1/recurrences/${id}`, 'PUT', parsed.payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/recurring');
  revalidatePath(`/recurring/${id}`);
  return {};
}

export async function deleteRecurrenceAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await fireflyWrite(`/v1/recurrences/${id}`, 'DELETE');
  revalidatePath('/recurring');
  redirect('/recurring');
}

export interface TriggerState {
  error?: string;
  ok?: boolean;
  created?: number;
}

/**
 * E10-04 — fire a recurrence by hand.
 *
 * Firefly wants a single `date`, not a `start`/`end` pair. Sending start/end is
 * answered with a 500 ("Call to a member function format() on null") rather
 * than a validation error, which makes it look like the endpoint is broken
 * instead of like the request is wrong.
 */
export async function triggerRecurrenceAction(
  _prev: TriggerState,
  formData: FormData,
): Promise<TriggerState> {
  const id = String(formData.get('id') ?? '');
  const date = String(formData.get('date') ?? '').trim();
  if (!id) return { error: 'Missing recurrence.' };
  if (!date) return { error: 'Pick the date to create it for.' };

  let result: { data?: unknown[] };
  try {
    result = await fireflyWrite<{ data?: unknown[] }>(`/v1/recurrences/${id}/trigger`, 'POST', {
      date,
    });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/recurring');
  revalidatePath(`/recurring/${id}`);
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { ok: true, created: Array.isArray(result?.data) ? result.data.length : 0 };
}
