'use client';

import * as React from 'react';
import { Download, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import type { PdfDocument } from '@/lib/pdf/spec';

/**
 * The one export control, used by every page that exports anything.
 *
 * It is the transactions toolbar's menu, generalised: a compact trigger that
 * shrinks to its glyph on a phone, and a panel whose items name the FORMAT and
 * say what the file will contain, rather than an icon to guess from. Reports
 * used a different dropdown with a "Print / save as PDF" item that handed the
 * job to the browser's print dialog; both now offer the same two formats in
 * the same place.
 *
 * The PDF renderer is imported on demand. jsPDF is several hundred kilobytes
 * and most visits never export anything, so it loads on the first click and
 * the route bundles stay where the budget has them.
 */

export type ExportRow = Record<string, string | number | null | undefined>;

export interface ExportOption {
  format: 'csv' | 'pdf';
  /** What this item produces, in a few words: "12 rows, one per month". */
  detail: string;
  run: () => void | Promise<void>;
}

/**
 * RFC 4180 quoting. A category called `Food, drink` or a note containing a
 * newline would otherwise shift every following column by one.
 */
function toCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function rowsToCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return '';
  // Union of every row's keys, not just the first row's, so an optional column
  // present only on later rows is not silently dropped.
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [
    columns.map(toCsvCell).join(','),
    ...rows.map((row) => columns.map((column) => toCsvCell(row[column])).join(',')),
  ];
  return lines.join('\r\n');
}

export function downloadCsv(filename: string, rows: ExportRow[]) {
  // The BOM is what makes Excel read the file as UTF-8 instead of the local
  // ANSI codepage — without it currency symbols and accented category names
  // arrive mangled.
  const blob = new Blob(['﻿', rowsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadPdfDocument(spec: PdfDocument, filename: string) {
  const { downloadPdf } = await import('./pdf-renderer');
  await downloadPdf(spec, filename);
}

const FORMATS = {
  csv: { title: 'CSV', subtitle: 'Spreadsheet', icon: FileSpreadsheet, tint: 'text-income' },
  pdf: { title: 'PDF', subtitle: 'Formatted document', icon: FileText, tint: 'text-expense' },
} as const;

export function ExportMenu({
  options,
  disabled = false,
  label = 'Export',
  className,
}: {
  options: ExportOption[];
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = React.useState<ExportOption['format'] | null>(null);

  const choose = async (option: ExportOption, close: () => void) => {
    if (busy) return;
    setBusy(option.format);
    try {
      await option.run();
      close();
    } catch (error) {
      console.error(error);
      toast.error(`Could not create the ${FORMATS[option.format].title} file. Please try again.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover
      align="end"
      label={label}
      contentClassName="w-72"
      className={className}
      trigger={(props) => (
        <Button
          {...props}
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 max-sm:w-9 max-sm:px-0"
          disabled={disabled}
          data-print="hide"
        >
          <Download className="size-4 shrink-0" aria-hidden="true" />
          <span className="max-sm:sr-only">{label}</span>
        </Button>
      )}
    >
      {(close) => (
        <div className="p-1" aria-busy={busy !== null}>
          {options.map((option) => {
            const format = FORMATS[option.format];
            const Icon = busy === option.format ? LoaderCircle : format.icon;
            return (
              <button
                key={option.format}
                type="button"
                disabled={busy !== null}
                onClick={() => void choose(option, close)}
                className="hover:bg-accent flex w-full items-start gap-2 rounded px-2 py-1.5 text-left disabled:cursor-wait disabled:opacity-70"
              >
                <Icon
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    busy === option.format ? 'text-muted-foreground animate-spin' : format.tint,
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {format.title}
                    <span className="text-muted-foreground font-normal"> · {format.subtitle}</span>
                  </span>
                  <span className="text-muted-foreground block text-xs leading-relaxed">
                    {busy === option.format ? 'Preparing…' : option.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}
