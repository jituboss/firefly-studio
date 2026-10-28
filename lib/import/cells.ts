import { toDecimal } from '@/lib/money';
import { FLOW_TYPES, kindFromFirefly, type AccountKind, type FlowType } from '@/lib/account-matrix';
import type { ColumnKey, HeaderMap } from './columns';

/**
 * Turning spreadsheet cells into transaction fields.
 *
 * Excel stores a typed number as an IEEE double and a date as a day count, so
 * the two fields a ledger cares most about are exactly the ones a spreadsheet
 * mangles. Both are handled here, once:
 *
 *  - An amount cell holding `12.1` arrives as 12.0999999999999996447… and goes
 *    through decimal.js from its shortest round-trip string, then is held to
 *    eight places so the residue of a formula (`=0.1+0.2`) cannot survive as
 *    `0.30000000000000004`. Money stays a string from here on (CONTRIBUTING).
 *  - A date cell arrives as a JS Date at UTC midnight of the calendar day, and
 *    a bare number in a date column is Excel's serial day. Both are read as
 *    UTC parts so no timezone can move the day, and text is accepted only as
 *    year-first, because 03/04/2026 means a different day on each side of the
 *    Atlantic and guessing silently books it in the wrong month.
 */

/** What the workbook reader hands over for one cell, already unwrapped. */
export type CellValue = string | number | boolean | Date | null;

export interface ImportRow {
  /** The spreadsheet row number, as the user sees it in Excel. */
  line: number;
  date: string | null;
  /** Positive, canonical decimal string. */
  amount: string | null;
  description: string;
  source: string;
  destination: string;
  type: FlowType | null;
  sourceKind: AccountKind | null;
  destinationKind: AccountKind | null;
  currency: string | null;
  foreignAmount: string | null;
  foreignCurrency: string | null;
  category: string;
  budget: string;
  tags: string[];
  notes: string;
  externalRef: string;
  /** Problems found reading the cells themselves. A row with any cannot import. */
  problems: string[];
  /** Non-blocking notes from reading, e.g. a negative amount taken as its magnitude. */
  notices: string[];
}

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
  return day <= days;
}

/** A date cell, serial number or year-first text → `YYYY-MM-DD`, or null. */
export function parseImportDate(value: CellValue): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 1 || value > 150_000) return null;
    const day = new Date(EXCEL_EPOCH_MS + Math.floor(value) * DAY_MS);
    return `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
  }
  if (typeof value !== 'string') return null;
  // A pasted datetime keeps its date part; the time of day is not imported.
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/.exec(value.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);
  return isRealDate(year, month, day) ? `${year}-${pad(month)}-${pad(day)}` : null;
}

export interface ParsedAmount {
  /** Magnitude, canonical: no exponent, no trailing zeros. */
  value: string;
  negative: boolean;
}

/**
 * An amount cell → a canonical positive decimal string.
 *
 * Text is forgiving about the things people type — currency symbols, spaces,
 * thousands separators, accounting brackets for a negative — and strict about
 * the one thing that is genuinely ambiguous. With both `,` and `.` present the
 * last one is the decimal point (1.234,56 and 1,234.56 both read as 1234.56).
 * A lone comma is a decimal comma unless it is unmistakably grouping thousands.
 */
export function parseImportAmount(value: CellValue): ParsedAmount | null {
  let text: string;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    text = String(value);
  } else if (typeof value === 'string') {
    text = value.trim();
  } else {
    return null;
  }
  if (!text) return null;

  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  text = text.replace(/[^\d.,\-+eE]/g, '');
  if (text.startsWith('-')) {
    negative = !negative;
    text = text.slice(1);
  } else if (text.startsWith('+')) {
    text = text.slice(1);
  }
  if (typeof value === 'string') {
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      text =
        lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
    } else if (lastComma >= 0) {
      text = /^\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
    }
  }
  if (!/^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(text)) return null;

  const decimal = toDecimal(text).toDecimalPlaces(8);
  if (decimal.isZero()) return null;
  return { value: decimal.abs().toFixed(), negative };
}

/** The canonical amount used in fingerprints: magnitude, eight places, no trailing zeros. */
export function canonicalAmount(value: string): string {
  return toDecimal(value).abs().toDecimalPlaces(8).toFixed();
}

function text(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return parseImportDate(value) ?? '';
  return String(value).trim();
}

/** Read one data row. Returns null for a row with nothing in it at all. */
export function readImportRow(
  cells: CellValue[],
  headers: HeaderMap,
  line: number,
): ImportRow | null {
  const cell = (key: ColumnKey): CellValue => {
    const index = headers.columns[key];
    return index === undefined ? null : (cells[index] ?? null);
  };
  const str = (key: ColumnKey) => text(cell(key));

  if (cells.every((value) => text(value) === '')) return null;

  const problems: string[] = [];
  const notices: string[] = [];

  const rawDate = cell('date');
  const date = parseImportDate(rawDate);
  if (!date) {
    problems.push(
      text(rawDate)
        ? `Date "${text(rawDate)}" is not a date. Use an Excel date or YYYY-MM-DD.`
        : 'Date is missing.',
    );
  }

  const rawAmount = cell('amount');
  const parsed = parseImportAmount(rawAmount);
  if (!parsed) {
    problems.push(
      text(rawAmount)
        ? `Amount "${text(rawAmount)}" is not a number above zero.`
        : 'Amount is missing.',
    );
  } else if (parsed.negative) {
    notices.push(
      `Amount was negative; imported as ${parsed.value}. Direction comes from Source → Destination, not the sign.`,
    );
  }

  const description = str('description');
  if (!description) problems.push('Description is missing.');
  const source = str('source');
  const destination = str('destination');
  if (!source) problems.push('Source is missing.');
  if (!destination) problems.push('Destination is missing.');

  let type: FlowType | null = null;
  const rawType = str('type').toLowerCase();
  if (rawType) {
    const aliases: Record<string, FlowType> = {
      expense: 'withdrawal',
      spend: 'withdrawal',
      payment: 'withdrawal',
      income: 'deposit',
      move: 'transfer',
    };
    type = (FLOW_TYPES as string[]).includes(rawType)
      ? (rawType as FlowType)
      : (aliases[rawType] ?? null);
    if (!type) problems.push(`Type "${str('type')}" is not withdrawal, deposit or transfer.`);
  }

  const kind = (key: 'source_kind' | 'destination_kind', label: string): AccountKind | null => {
    const raw = str(key);
    if (!raw) return null;
    const value = kindFromFirefly(raw);
    if (!value) {
      problems.push(
        `${label} "${raw}" is not one of asset, expense, revenue, cash, loan, debt or mortgage.`,
      );
    }
    return value;
  };

  const code = (key: ColumnKey, label: string): string | null => {
    const raw = str(key).toUpperCase();
    if (!raw) return null;
    if (!/^[A-Z]{3}$/.test(raw)) {
      problems.push(`${label} "${str(key)}" is not a three-letter currency code.`);
      return null;
    }
    return raw;
  };

  const currency = code('currency', 'Currency');
  const foreignCurrency = code('foreign_currency', 'Foreign currency');
  let foreignAmount: string | null = null;
  if (text(cell('foreign_amount'))) {
    const foreign = parseImportAmount(cell('foreign_amount'));
    if (!foreign) problems.push(`Foreign amount "${str('foreign_amount')}" is not a number.`);
    else foreignAmount = foreign.value;
  }
  if (foreignAmount && !foreignCurrency) {
    problems.push('A foreign amount needs a foreign currency.');
  }

  return {
    line,
    date,
    amount: parsed?.value ?? null,
    description,
    source,
    destination,
    type,
    sourceKind: kind('source_kind', 'Source kind'),
    destinationKind: kind('destination_kind', 'Destination kind'),
    currency,
    foreignAmount,
    foreignCurrency: foreignAmount ? foreignCurrency : null,
    category: str('category'),
    budget: str('budget'),
    tags: str('tags')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: str('notes'),
    externalRef: str('external_ref'),
    problems,
    notices,
  };
}
