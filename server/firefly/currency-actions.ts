'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fireflyWrite, FireflyRequestError } from './api';
import type { Currency } from './types';

/** E13-01 … E13-04 — currency and exchange-rate writes. */

export interface CurrencyFormState {
  error?: string;
}

function readCurrency(formData: FormData) {
  const code = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase();
  const name = String(formData.get('name') ?? '').trim();
  const symbol = String(formData.get('symbol') ?? '').trim();
  // Sent as a string: Firefly coerces it, and the money lint rule bans Number()
  // outside lib/money.ts.
  const decimalPlaces = String(formData.get('decimal_places') ?? '2').trim();

  return {
    code,
    name,
    symbol,
    payload: {
      code,
      name,
      symbol,
      decimal_places: decimalPlaces,
      enabled: formData.get('enabled') !== 'off',
    },
  };
}

export async function createCurrencyAction(
  _prev: CurrencyFormState,
  formData: FormData,
): Promise<CurrencyFormState> {
  const parsed = readCurrency(formData);
  if (!parsed.code) return { error: 'A currency code is required.' };
  if (!parsed.name) return { error: 'A name is required.' };
  if (!parsed.symbol) return { error: 'A symbol is required.' };

  let created: { data: Currency };
  try {
    created = await fireflyWrite<{ data: Currency }>('/v1/currencies', 'POST', parsed.payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/currencies');
  redirect(`/currencies/${created.data.attributes.code}`);
}

export async function updateCurrencyAction(
  _prev: CurrencyFormState,
  formData: FormData,
): Promise<CurrencyFormState> {
  const original = String(formData.get('original') ?? '');
  const parsed = readCurrency(formData);
  if (!original) return { error: 'Missing currency.' };
  if (!parsed.name) return { error: 'A name is required.' };

  try {
    await fireflyWrite(`/v1/currencies/${original}`, 'PUT', parsed.payload);
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/currencies');
  revalidatePath(`/currencies/${original}`);
  return {};
}

/**
 * E13-01 — enable, disable, or make primary.
 *
 * These are three separate Firefly endpoints rather than fields on the
 * currency, and they are POSTs with no body.
 */
export async function setCurrencyStateAction(formData: FormData): Promise<void> {
  const code = String(formData.get('code') ?? '');
  const state = String(formData.get('state') ?? '');
  if (!code || !state) return;

  const path =
    state === 'primary'
      ? `/v1/currencies/${code}/primary`
      : state === 'enable'
        ? `/v1/currencies/${code}/enable`
        : `/v1/currencies/${code}/disable`;

  await fireflyWrite(path, 'POST', {});

  // The primary currency is what every amount in the app is reported in, so a
  // change here invalidates far more than the currency list.
  revalidatePath('/currencies');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
}

export async function deleteCurrencyAction(formData: FormData): Promise<void> {
  const code = String(formData.get('code') ?? '');
  if (!code) return;
  await fireflyWrite(`/v1/currencies/${code}`, 'DELETE');
  revalidatePath('/currencies');
  redirect('/currencies');
}

// --- exchange rates ---------------------------------------------------------

export interface RateFormState {
  error?: string;
  ok?: boolean;
}

/** E13-03 / E13-04 — record what one currency was worth in another on a date. */
export async function saveExchangeRateAction(
  _prev: RateFormState,
  formData: FormData,
): Promise<RateFormState> {
  const from = String(formData.get('from') ?? '')
    .trim()
    .toUpperCase();
  const to = String(formData.get('to') ?? '')
    .trim()
    .toUpperCase();
  const date = String(formData.get('date') ?? '').trim();
  const rate = String(formData.get('rate') ?? '').trim();

  if (!from || !to) return { error: 'Pick both currencies.' };
  if (from === to) return { error: 'A currency is always worth one of itself.' };
  if (!date) return { error: 'Pick a date.' };
  if (!rate) return { error: 'Enter a rate.' };

  try {
    // The rate stays a string all the way to Firefly — it is a number whose
    // precision matters, which is exactly what lib/money.ts exists to protect.
    //
    // The request fields are `from` and `to`, NOT the `from_currency_code` /
    // `to_currency_code` the GET response comes back with. Sending the names
    // that were read out of a response is a 422 saying "The from field is
    // required", which is confusing precisely because the payload plainly has
    // the currencies in it.
    await fireflyWrite('/v1/exchange-rates', 'POST', { from, to, date, rate });
  } catch (error) {
    if (error instanceof FireflyRequestError) return { error: error.message };
    throw error;
  }

  revalidatePath('/currencies');
  revalidatePath('/currencies/rates');
  return { ok: true };
}

export async function deleteExchangeRateAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await fireflyWrite(`/v1/exchange-rates/${id}`, 'DELETE');
  revalidatePath('/currencies/rates');
}
