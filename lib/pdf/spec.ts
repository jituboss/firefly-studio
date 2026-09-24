import { add, formatMoney, isNegative, isPositive, toDecimal, type MoneyInput } from '../money';
import { formatDate, formatMonthLabel } from '../date';

/**
 * The shape of an exported PDF, independent of the library that draws it.
 *
 * A page describes WHAT goes in the document — a title, the period, headline
 * figures, tables — and `components/export/pdf-renderer.ts` decides how it
 * looks. Everything here is plain serialisable data, so a Server Component can
 * build the spec next to the rows it already rendered and hand it to the
 * client untouched, and it is pure so the formatting rules can be tested
 * without a browser.
 *
 * Like the CSV, the PDF is made from the rows the page rendered rather than a
 * second query, so the document always agrees with the screen that produced it.
 */

export type PdfCellValue = string | number | null | undefined;
export type PdfRow = Record<string, PdfCellValue>;

/**
 * How a value is coloured.
 *
 * `auto` colours by sign — green when positive, red when negative — which is
 * right for a net or a variance and WRONG for a spending column, where Firefly
 * reports the magnitude and a larger number is not good news. Those columns
 * state their tone rather than letting the sign decide it.
 */
export type PdfTone = 'income' | 'expense' | 'neutral' | 'auto' | 'accent';

export type PdfColumnKind = 'text' | 'money' | 'date' | 'month' | 'count' | 'percent';

export interface PdfColumn {
  key: string;
  header: string;
  kind?: PdfColumnKind;
  tone?: PdfTone;
  /**
   * For a money column whose rows are not all in the table's currency: the row
   * key holding each row's own code. A row in another currency prints its
   * code beside the amount instead of passing as the table's.
   */
  currencyKey?: string;
  /** Sum this column into the table's footer. Money and count columns only. */
  total?: boolean;
  /** A second, muted line under the value — a category under a description. */
  detailKey?: string;
  /** Draw a proportional bar behind the cell. Percent columns only. */
  bar?: boolean;
  /** Relative width hint; the renderer shares what is left between the rest. */
  width?: number;
}

export interface PdfTable {
  title?: string;
  description?: string;
  columns: PdfColumn[];
  rows: PdfRow[];
  /** The currency this table's money columns are denominated in. */
  currency?: string;
  /** Shown in place of an empty table, so a blank page is never ambiguous. */
  emptyMessage?: string;
  /** Label for the totals row; totals are drawn when any column asks for one. */
  totalLabel?: string;
}

export interface PdfStat {
  label: string;
  value: PdfCellValue;
  kind?: 'money' | 'text' | 'count' | 'percent';
  currency?: string;
  tone?: PdfTone;
  hint?: string;
}

/** A simple bar chart, drawn natively so it prints sharply at any zoom. */
export interface PdfChart {
  title?: string;
  description?: string;
  /** Row key whose value labels each bar group, e.g. the month. */
  labelKey: string;
  /** How the label is formatted. */
  labelKind?: 'text' | 'date' | 'month';
  series: { key: string; label: string; tone: PdfTone | 'accent-2' | 'accent-3' }[];
  rows: PdfRow[];
  currency?: string;
}

export interface PdfBalanceSummary {
  opening: string;
  closing: string;
  currency: string;
  openingLabel?: string;
  closingLabel?: string;
}

export interface PdfDocument {
  /** "Report" or "Statement" in the header badge, and in the file's own metadata. */
  kind: 'report' | 'statement';
  title: string;
  /** Usually the period label — "This month", "Last 12 months". */
  subtitle?: string;
  description?: string;
  period?: { start: string; end: string };
  currency?: string;
  /** Extra key/value facts for the information strip under the header. */
  facts?: { label: string; value: string }[];
  stats?: PdfStat[];
  balance?: PdfBalanceSummary;
  charts?: PdfChart[];
  tables: PdfTable[];
  /** Footnotes, printed after the last table. */
  notes?: string[];
  /** Header colour; defaults to the app's primary. */
  accent?: PdfAccent;
  locale?: string;
  timezone?: string;
}

export type PdfAccent = 'blue' | 'green' | 'violet' | 'teal' | 'amber' | 'rose' | 'indigo';

/**
 * The same locale with Latin digits forced.
 *
 * The embedded font carries Latin, Greek and Cyrillic, not every script's
 * numerals, and a `bn-BD` user's formatter would otherwise emit Bengali digits
 * the PDF cannot draw — a statement of blank boxes. Grouping and decimal
 * separators still follow the user's locale.
 */
export function pdfLocale(locale = 'en-US'): string {
  try {
    return new Intl.Locale(locale, { numberingSystem: 'latn' }).toString();
  } catch {
    return 'en-US';
  }
}

/**
 * An amount for a PDF cell: grouped digits, no currency symbol.
 *
 * Symbols are left out on purpose. The table header names the currency once,
 * which is how a bank statement does it, and it avoids symbols such as ৳ that
 * the embedded font has no glyph for. A row in a DIFFERENT currency from its
 * table keeps its code, because an unlabelled dollar amount in a taka column
 * reads as taka.
 */
export function formatPdfMoney(
  value: MoneyInput,
  options: { locale?: string; currency?: string; tableCurrency?: string } = {},
): string {
  const number = formatMoney(value, { locale: pdfLocale(options.locale), hideSymbol: true });
  if (options.currency && options.currency !== options.tableCurrency) {
    return `${options.currency} ${number}`;
  }
  return number;
}

/** A headline figure: always carries its code, since a stat card has no header. */
export function formatPdfStat(stat: PdfStat, locale?: string): string {
  const { value } = stat;
  if (value === null || value === undefined || value === '') return '—';
  switch (stat.kind ?? 'money') {
    case 'money': {
      const number = formatMoney(value, { locale: pdfLocale(locale), hideSymbol: true });
      return stat.currency ? `${stat.currency} ${number}` : number;
    }
    case 'count':
      return typeof value === 'number' ? value.toLocaleString(pdfLocale(locale)) : String(value);
    case 'percent':
      return `${toDecimal(value).toFixed(1)}%`;
    default:
      return String(value);
  }
}

export interface CellContext {
  locale?: string;
  timezone?: string;
  currency?: string;
}

/** One cell as text. Empty values render as an en dash, never as "undefined". */
export function formatPdfCell(column: PdfColumn, row: PdfRow, context: CellContext = {}): string {
  const value = row[column.key];
  if (value === null || value === undefined || value === '') {
    return column.kind === 'money' || column.kind === 'count' ? '' : '—';
  }

  switch (column.kind ?? 'text') {
    case 'money': {
      const rowCurrency = column.currencyKey ? row[column.currencyKey] : undefined;
      return formatPdfMoney(value, {
        locale: context.locale,
        currency: typeof rowCurrency === 'string' ? rowCurrency : undefined,
        tableCurrency: context.currency,
      });
    }
    case 'date':
      return typeof value === 'string'
        ? formatDate(value.slice(0, 10), {
            timezone: context.timezone,
            locale: pdfLocale(context.locale),
            style: 'medium',
          })
        : String(value);
    case 'month':
      return typeof value === 'string' && /^\d{4}-\d{2}/.test(value)
        ? formatMonthLabel(value.slice(0, 10), context.timezone, pdfLocale(context.locale))
        : String(value);
    case 'count':
      return typeof value === 'number'
        ? value.toLocaleString(pdfLocale(context.locale))
        : String(value);
    case 'percent':
      return `${toDecimal(value).toFixed(1)}%`;
    default:
      return String(value);
  }
}

/**
 * The colour a value should print in: `income`, `expense` or `neutral`.
 *
 * Resolved here rather than in the renderer so the one rule that matters — an
 * `auto` tone follows the sign, every other tone is fixed — is tested.
 */
export function resolveTone(tone: PdfTone | undefined, value: PdfCellValue): PdfTone {
  if (tone !== 'auto') return tone ?? 'neutral';
  if (value === null || value === undefined || value === '') return 'neutral';
  if (isNegative(value)) return 'expense';
  if (isPositive(value)) return 'income';
  return 'neutral';
}

/**
 * The footer row: a sum for every column that asks for one.
 *
 * Money is summed on Decimal, never on floats, and only over rows in the
 * table's own currency: adding a dollar row to a taka total invents a number.
 * The skipped count is returned so the caller can say what was left out.
 */
export function columnTotals(table: PdfTable): { totals: PdfRow; skipped: number } {
  const totals: PdfRow = {};
  let skipped = 0;
  const columns = table.columns.filter((column) => column.total);
  if (columns.length === 0) return { totals, skipped };

  for (const column of columns) {
    if (column.kind === 'count') {
      totals[column.key] = table.rows.reduce<number>(
        (sum, row) => sum + (typeof row[column.key] === 'number' ? (row[column.key] as number) : 0),
        0,
      );
      continue;
    }
    let sum = toDecimal(0);
    let columnSkipped = 0;
    for (const row of table.rows) {
      const rowCurrency = column.currencyKey ? row[column.currencyKey] : undefined;
      if (table.currency && typeof rowCurrency === 'string' && rowCurrency !== table.currency) {
        if (row[column.key] !== null && row[column.key] !== undefined && row[column.key] !== '') {
          columnSkipped += 1;
        }
        continue;
      }
      sum = add(sum, row[column.key]);
    }
    skipped = Math.max(skipped, columnSkipped);
    totals[column.key] = sum.toString();
  }
  return { totals, skipped };
}

/** Header text with the currency named once, the way a statement column is labelled. */
export function columnHeader(column: PdfColumn, currency?: string): string {
  return column.kind === 'money' && currency ? `${column.header} (${currency})` : column.header;
}

/** A download name: lowercase, hyphenated, no characters a filesystem objects to. */
export function pdfFilename(base: string): string {
  const slug = base
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
  return `${slug || 'export'}.pdf`;
}

/** "1 Sep 2026 – 30 Sep 2026", in the user's zone and with Latin digits. */
export function describePeriod(
  period: { start: string; end: string },
  locale?: string,
  timezone?: string,
): string {
  const options = { locale: pdfLocale(locale), timezone, style: 'medium' as const };
  return `${formatDate(period.start, options)} – ${formatDate(period.end, options)}`;
}
