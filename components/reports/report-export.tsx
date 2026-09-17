'use client';

import * as React from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * E14-11 — get a report out of the app.
 *
 * CSV is generated in the browser from the rows the report already rendered,
 * so an export is guaranteed to match what is on screen rather than re-running
 * the query and risking a different answer. PDF is the print stylesheet plus
 * the browser's own "Save as PDF", which produces a better document than any
 * client-side PDF library would and costs nothing to maintain.
 */

export type ExportRow = Record<string, string | number | null | undefined>;

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

function download(filename: string, contents: string, mime: string) {
  // The BOM is what makes Excel read the file as UTF-8 instead of the local
  // ANSI codepage — without it currency symbols and accented category names
  // arrive mangled.
  const blob = new Blob(['﻿', contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ReportExportButton({
  rows,
  filename,
  label = 'Export',
}: {
  rows: ExportRow[];
  filename: string;
  label?: string;
}) {
  const disabled = rows.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} data-print="hide">
          <Download className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => download(`${filename}.csv`, rowsToCsv(rows), 'text/csv')}>
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          Print / save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
