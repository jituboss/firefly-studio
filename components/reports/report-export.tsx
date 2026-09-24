'use client';

import {
  ExportMenu,
  downloadCsv,
  downloadPdfDocument,
  type ExportRow,
} from '@/components/export/export-menu';
import type { PdfColumn, PdfDocument, PdfTable } from '@/lib/pdf/spec';

export { rowsToCsv, type ExportRow } from '@/components/export/export-menu';

/**
 * E14-11 — get a report out of the app, as CSV or as a formatted PDF.
 *
 * Both files are built in the browser from the rows the report already
 * rendered, so an export is guaranteed to match what is on screen rather than
 * re-running the query and risking a different answer.
 *
 * The CSV is the raw rows. The PDF is the same rows laid out as a document:
 * the page describes it with `pdf` — its title, period, headline figures and
 * how each column is formatted — and the main table is `rows` under `columns`.
 * Further tables and charts ride along in `pdf.tables` / `pdf.charts`.
 */
export interface ReportPdf extends Omit<PdfDocument, 'kind' | 'tables'> {
  kind?: PdfDocument['kind'];
  /** How `rows` is laid out in the PDF's main table. */
  columns: PdfColumn[];
  tableTitle?: string;
  tableDescription?: string;
  totalLabel?: string;
  /** Tables printed after the main one. */
  tables?: PdfTable[];
}

export function ReportExportButton({
  rows,
  filename,
  label = 'Export',
  pdf,
}: {
  rows: ExportRow[];
  filename: string;
  label?: string;
  pdf: ReportPdf;
}) {
  const count = `${rows.length} row${rows.length === 1 ? '' : 's'}`;
  const { columns, tableTitle, tableDescription, totalLabel, tables = [], ...rest } = pdf;

  return (
    <ExportMenu
      label={label}
      disabled={rows.length === 0}
      options={[
        {
          format: 'csv',
          detail: `${count}, ready for a spreadsheet`,
          run: () => downloadCsv(`${filename}.csv`, rows),
        },
        {
          format: 'pdf',
          detail: `${pdf.title} with summary${pdf.charts?.length ? ', chart' : ''} and ${count}`,
          run: () =>
            downloadPdfDocument(
              {
                kind: 'report',
                ...rest,
                tables: [
                  {
                    title: tableTitle,
                    description: tableDescription,
                    columns,
                    rows,
                    currency: pdf.currency,
                    totalLabel,
                  },
                  ...tables,
                ],
              },
              filename,
            ),
        },
      ]}
    />
  );
}
