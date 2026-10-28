import 'server-only';
import ExcelJS from 'exceljs';
import {
  IMPORT_COLUMNS,
  TEMPLATE_COLUMNS,
  type ColumnKey,
  type ImportColumn,
} from '@/lib/import/columns';
import { parseCsv } from '@/lib/import/csv';
import type { CellValue } from '@/lib/import/cells';
import { SAMPLE_NOTE } from '@/lib/import/sample';

/** The data sheet's name in the template, and the one the reader looks for first. */
export const DATA_SHEET = 'Transactions';
export const MAX_IMPORT_ROWS = 2000;

export class WorkbookError extends Error {}

export interface SheetData {
  headers: string[];
  rows: Array<{ line: number; cells: CellValue[] }>;
}

/** exceljs wraps formulas, rich text and links in objects; the import wants the value. */
function unwrap(value: ExcelJS.CellValue): CellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('result' in value) return unwrap(value.result as ExcelJS.CellValue);
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return String(value.text);
    if ('error' in value) return null;
  }
  return null;
}

function fromGrid(grid: CellValue[][]): SheetData {
  const headerIndex = grid.findIndex((row) => row.some((cell) => String(cell ?? '').trim() !== ''));
  if (headerIndex < 0) throw new WorkbookError('The file has no header row.');
  const headers = grid[headerIndex]!.map((cell) => String(cell ?? '').trim());
  const rows = grid
    .slice(headerIndex + 1)
    .map((cells, offset) => ({ line: headerIndex + offset + 2, cells }))
    .filter((row) => row.cells.some((cell) => cell !== null && String(cell).trim() !== ''));
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new WorkbookError(
      `The file has ${rows.length} rows; an import takes at most ${MAX_IMPORT_ROWS}. Split it into several files.`,
    );
  }
  return { headers, rows };
}

/** Read the first data sheet of an .xlsx, or a .csv, into headers and rows. */
export async function readWorkbook(bytes: ArrayBuffer, fileName: string): Promise<SheetData> {
  if (/\.csv$/i.test(fileName)) {
    return fromGrid(parseCsv(new TextDecoder('utf-8').decode(bytes)));
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(Buffer.from(bytes) as unknown as ExcelJS.Buffer);
  } catch {
    throw new WorkbookError(
      'This does not look like an Excel workbook. Save it as .xlsx (or .csv) and try again.',
    );
  }
  const sheet = workbook.getWorksheet(DATA_SHEET) ?? workbook.worksheets[0];
  if (!sheet) throw new WorkbookError('The workbook has no sheets.');

  const grid: CellValue[][] = [];
  const width = Math.min(sheet.columnCount, 64);
  sheet.eachRow({ includeEmpty: true }, (row, number) => {
    if (number > MAX_IMPORT_ROWS + 50) return;
    const cells: CellValue[] = [];
    for (let column = 1; column <= width; column += 1) {
      cells.push(unwrap(row.getCell(column).value));
    }
    grid[number - 1] = cells;
  });
  for (let i = 0; i < grid.length; i += 1) grid[i] ??= [];
  return fromGrid(grid);
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  row.alignment = { vertical: 'middle' };
  row.height = 20;
}

function columnsFor(keys: ColumnKey[]): ImportColumn[] {
  return keys.map((key) => IMPORT_COLUMNS.find((column) => column.key === key)!);
}

export interface TemplateSamples {
  /** Your main account, or a stand-in name when the ledger has none yet. */
  account: string;
  /** A second account of yours for the transfer sample. */
  savings: string;
  /** Dates for the samples, YYYY-MM-DD. */
  dates: [string, string, string];
}

/**
 * The template: one sheet, nine columns, a frozen header with a hover note on
 * each, and three sample rows — money in, money out, money moved between your
 * own accounts — written with the ledger's real account names when it has
 * them, so the first thing a new user sees is their own setup in the shape the
 * import wants. The samples carry `SAMPLE_NOTE`, and the import skips any row
 * that does, so leaving them in is harmless.
 */
export async function buildTemplate(samples: TemplateSamples): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Firefly Studio';

  const sheet = workbook.addWorksheet(DATA_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
  const columns = columnsFor(TEMPLATE_COLUMNS);
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width,
  }));
  styleHeader(sheet.getRow(1));
  columns.forEach((column, index) => {
    sheet.getRow(1).getCell(index + 1).note =
      `${column.required ? 'Required. ' : ''}${column.help}`;
  });

  // Excel's own serial day number: shown as a date by the column's format, and
  // read back by `parseImportDate`, with no timezone anywhere in between.
  const day = (value: string) => {
    const [year, month, date] = value.split('-').map((part) => Number.parseInt(part, 10));
    return (Date.UTC(year!, month! - 1, date!) - Date.UTC(1899, 11, 30)) / 86_400_000;
  };
  const rows: Array<Partial<Record<ColumnKey, string | number | Date>>> = [
    {
      date: day(samples.dates[0]),
      description: 'Monthly salary',
      amount: 3200,
      source: 'Acme Ltd',
      destination: samples.account,
      category: 'Salary',
      tags: 'income',
      notes: SAMPLE_NOTE,
    },
    {
      date: day(samples.dates[1]),
      description: 'Weekly groceries',
      amount: 54.2,
      source: samples.account,
      destination: 'Corner Market',
      category: 'Groceries',
      budget: 'Food',
      tags: 'weekly',
      notes: SAMPLE_NOTE,
    },
    {
      date: day(samples.dates[2]),
      description: 'Move to savings',
      amount: 500,
      source: samples.account,
      destination: samples.savings,
      category: 'Savings',
      notes: SAMPLE_NOTE,
    },
  ];
  for (const values of rows) {
    const row = sheet.addRow(values);
    row.font = { italic: true, color: { argb: 'FF64748B' } };
  }
  sheet.getColumn('date').numFmt = 'yyyy-mm-dd';
  sheet.getColumn('amount').numFmt = '#,##0.00';

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * The rows that did not import, in the template's own layout plus an Error
 * column, so they can be fixed in place and uploaded again. Values are written
 * as typed cells, never as formulas, so a description beginning with "=" stays
 * text.
 */
export async function buildRowsWorkbook(
  rows: Array<{ values: Partial<Record<ColumnKey, string | number | Date | null>>; error: string }>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(DATA_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    ...IMPORT_COLUMNS.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width,
    })),
    { header: 'Error', key: 'error', width: 60 },
  ];
  styleHeader(sheet.getRow(1));
  for (const row of rows) {
    const added = sheet.addRow({ ...row.values, error: row.error });
    added.getCell(IMPORT_COLUMNS.length + 1).font = { color: { argb: 'FFB91C1C' } };
  }
  sheet.getColumn('date').numFmt = 'yyyy-mm-dd';
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
