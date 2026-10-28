import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildRowsWorkbook, buildTemplate, readWorkbook } from '@/server/import/workbook';
import { mapHeaders } from '@/lib/import/columns';
import { readImportRow } from '@/lib/import/cells';
import { isSampleRow } from '@/lib/import/sample';

/**
 * The template and the reader must agree, through a real xlsx file: a header
 * renamed in one and not the other makes every upload fail with "missing
 * column", which no unit test of either half alone would catch.
 */

async function bytes(buffer: Buffer): Promise<ArrayBuffer> {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

describe('the import workbook', () => {
  it('reads back the template it writes, filled in the way Excel would', async () => {
    const template = await buildTemplate({
      account: 'Everyday Current',
      savings: 'Savings',
      dates: ['2026-10-01', '2026-10-02', '2026-10-03'],
    });

    // Fill it in: a typed date cell and a typed number, as Excel stores them.
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template as unknown as ExcelJS.Buffer);
    // One sheet, seven columns — the template is meant to be filled in, not read.
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Transactions']);
    const sheet = workbook.getWorksheet('Transactions')!;
    // The three samples sit in rows 2–4; the user's own row goes below them.
    sheet.getRow(5).values = [
      new Date(Date.UTC(2026, 9, 1)),
      'Weekly shop',
      42.1,
      'Everyday Current',
      'Rewe',
    ];
    sheet.getRow(5).commit();
    const filled = Buffer.from(await workbook.xlsx.writeBuffer());

    const read = await readWorkbook(await bytes(filled), 'mine.xlsx');
    expect(read.headers).toEqual([
      'Date',
      'Description',
      'Amount',
      'Source',
      'Destination',
      'Category',
      'Budget',
      'Tags',
      'Notes',
    ]);
    const headers = mapHeaders(read.headers);
    expect(headers.missing).toEqual([]);
    expect(headers.ignored).toEqual([]);
    expect(read.rows).toHaveLength(4);
    const rows = read.rows.map(({ cells, line }) => readImportRow(cells, headers, line)!);

    // The samples read cleanly — a deposit, a withdrawal and a transfer — and
    // are recognised as samples, so the planner skips them.
    expect(rows.slice(0, 3).map((r) => [r.source, r.destination])).toEqual([
      ['Acme Ltd', 'Everyday Current'],
      ['Everyday Current', 'Corner Market'],
      ['Everyday Current', 'Savings'],
    ]);
    expect(rows.slice(0, 3).every((r) => isSampleRow(r.notes) && r.problems.length === 0)).toBe(
      true,
    );

    const row = rows[3];
    expect(row).toMatchObject({
      line: 5,
      date: '2026-10-01',
      amount: '42.1',
      description: 'Weekly shop',
      source: 'Everyday Current',
      destination: 'Rewe',
      problems: [],
    });
  });

  it('round-trips the failed-rows export, ignoring its Error column', async () => {
    const file = await buildRowsWorkbook([
      {
        values: {
          date: '2026-10-02',
          amount: '5',
          description: '=SUM(A1)',
          source: 'A',
          destination: 'B',
        },
        error: 'Nope',
      },
    ]);
    const read = await readWorkbook(await bytes(file), 'failed.xlsx');
    const headers = mapHeaders(read.headers);
    expect(headers.missing).toEqual([]);
    expect(headers.ignored).toEqual(['Error']);
    // Written as text, never as a formula.
    expect(read.rows[0]!.cells[headers.columns.description!]).toBe('=SUM(A1)');
  });

  it('reads a CSV as text, without guessing at dates', async () => {
    const csv = new TextEncoder().encode(
      'Date,Amount,Description,Source,Destination\n2026-10-03,"1,5",Tea,A,B\n',
    );
    const read = await readWorkbook(csv.buffer as ArrayBuffer, 'x.csv');
    expect(read.rows[0]!.cells).toEqual(['2026-10-03', '1,5', 'Tea', 'A', 'B']);
  });

  it('refuses a file that is not a workbook', async () => {
    await expect(
      readWorkbook(new TextEncoder().encode('nope').buffer as ArrayBuffer, 'x.xlsx'),
    ).rejects.toThrow(/Excel workbook/);
  });
});
