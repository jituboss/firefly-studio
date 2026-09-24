import { GState, jsPDF } from 'jspdf';
import { autoTable, type CellHookData, type FontStyle, type RowInput } from 'jspdf-autotable';
import { formatDate } from '@/lib/date';
import { formatMoney, toDecimal } from '@/lib/money';
import {
  columnHeader,
  columnTotals,
  describePeriod,
  formatPdfCell,
  formatPdfStat,
  pdfFilename,
  pdfLocale,
  resolveTone,
  type PdfAccent,
  type PdfChart,
  type PdfDocument,
  type PdfRow,
  type PdfStat,
  type PdfTable,
  type PdfTone,
} from '@/lib/pdf/spec';

/**
 * Draws a `PdfDocument` with jsPDF and downloads it.
 *
 * This module is only ever reached through a dynamic `import()` from the export
 * menu, so jsPDF (≈350 kB) and the fonts load on the first click rather than
 * with every page — the route bundles do not move. See `export-menu.tsx`.
 *
 * **Why jsPDF rather than the print stylesheet.** "Print → Save as PDF" was the
 * previous answer and it produced whatever the browser's print dialog felt
 * like: margins, headers and page breaks decided per browser, and nothing a
 * phone could do at all. A drawn document looks the same everywhere, carries a
 * proper header and page numbers, and is one tap.
 *
 * **Why an embedded font.** jsPDF's built-in Helvetica is WinAnsi only: a payee
 * called "Łódź" or "Москва" prints as garbage. Inter covers Latin, Greek and
 * Cyrillic and is fetched from `/fonts` on first use (OFL, see
 * `public/fonts/OFL.txt`). If the fetch fails the document still renders, in
 * Helvetica, rather than failing the export.
 */

type RGB = [number, number, number];

const INK: RGB = [15, 23, 42];
const BODY: RGB = [51, 65, 85];
const MUTED: RGB = [100, 116, 139];
const HAIRLINE: RGB = [226, 232, 240];
const ZEBRA: RGB = [248, 250, 252];
const WHITE: RGB = [255, 255, 255];

const TONES: Record<'income' | 'expense' | 'neutral', RGB> = {
  income: [21, 128, 61],
  expense: [200, 45, 45],
  neutral: INK,
};

/** Header gradients: from a deep shade on the left to a bright one on the right. */
const ACCENTS: Record<PdfAccent, { from: RGB; to: RGB; ink: RGB }> = {
  blue: { from: [30, 58, 138], to: [37, 99, 235], ink: [37, 99, 235] },
  indigo: { from: [49, 46, 129], to: [99, 102, 241], ink: [79, 70, 229] },
  violet: { from: [76, 29, 149], to: [139, 92, 246], ink: [124, 58, 237] },
  teal: { from: [17, 94, 89], to: [20, 184, 166], ink: [13, 148, 136] },
  green: { from: [20, 83, 45], to: [34, 197, 94], ink: [22, 163, 74] },
  amber: { from: [146, 64, 14], to: [245, 158, 11], ink: [217, 119, 6] },
  rose: { from: [136, 19, 55], to: [244, 63, 94], ink: [225, 29, 72] },
};

/** Secondary series colours for charts, chosen to sit beside any accent. */
const SERIES_EXTRA: RGB[] = [
  [245, 158, 11],
  [139, 92, 246],
  [20, 184, 166],
];

const PAGE_MARGIN = 40;
const RUNNING_HEADER = 44;
const FOOTER = 36;

function mix(color: RGB, into: RGB, amount: number): RGB {
  return color.map((channel, index) =>
    Math.round(channel + ((into[index] ?? channel) - channel) * amount),
  ) as RGB;
}

function toneColor(tone: PdfTone, accent: RGB): RGB {
  if (tone === 'accent') return accent;
  if (tone === 'income' || tone === 'expense') return TONES[tone];
  return TONES.neutral;
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const FONT = 'Inter';
const FONT_FILES = [
  { file: 'Inter-Regular.ttf', style: 'normal' },
  { file: 'Inter-SemiBold.ttf', style: 'semibold' },
  { file: 'Inter-Bold.ttf', style: 'bold' },
] as const;

let fontData: Promise<{ file: string; style: string; data: string }[] | null> | null = null;

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // Chunked: spreading 300 kB into one fromCharCode call overflows the stack.
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function loadFonts() {
  fontData ??= Promise.all(
    FONT_FILES.map(async ({ file, style }) => {
      const response = await fetch(`/fonts/${file}`);
      if (!response.ok) throw new Error(`font ${file}: ${response.status}`);
      return { file, style, data: toBase64(await response.arrayBuffer()) };
    }),
  ).catch(() => {
    // Forget the failure so the next export tries again.
    fontData = null;
    return null;
  });
  return fontData;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

class Canvas {
  readonly doc: jsPDF;
  readonly width: number;
  readonly height: number;
  readonly accent: { from: RGB; to: RGB; ink: RGB };
  readonly locale?: string;
  readonly timezone?: string;
  family = 'helvetica';
  y = PAGE_MARGIN;

  constructor(spec: PdfDocument) {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    this.width = this.doc.internal.pageSize.getWidth();
    this.height = this.doc.internal.pageSize.getHeight();
    this.accent = ACCENTS[spec.accent ?? 'blue'];
    this.locale = spec.locale;
    this.timezone = spec.timezone;
  }

  get contentWidth() {
    return this.width - PAGE_MARGIN * 2;
  }

  font(style: 'normal' | 'semibold' | 'bold', size: number, color: RGB = INK) {
    const resolved = this.family === 'helvetica' && style === 'semibold' ? 'bold' : style;
    this.doc.setFont(this.family, resolved);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  fill(color: RGB) {
    this.doc.setFillColor(...color);
  }

  /** Start a new page when `needed` points would run into the footer. */
  ensure(needed: number) {
    if (this.y + needed > this.height - FOOTER - 12) {
      this.doc.addPage();
      this.y = RUNNING_HEADER + 16;
    }
  }

  /** Shrink text until it fits, so a long total never runs out of its card. */
  fitSize(text: string, maxWidth: number, start: number, min: number) {
    let size = start;
    this.doc.setFontSize(size);
    while (size > min && this.doc.getTextWidth(text) > maxWidth) {
      size -= 0.5;
      this.doc.setFontSize(size);
    }
    return size;
  }

  gradient(x: number, y: number, w: number, h: number) {
    const steps = 80;
    const stripe = w / steps;
    for (let index = 0; index < steps; index++) {
      this.fill(mix(this.accent.from, this.accent.to, index / (steps - 1)));
      // Overlap by a hair so no seam shows between stripes at any zoom.
      this.doc.rect(x + index * stripe, y, stripe + 0.6, h, 'F');
    }
  }

  withOpacity(opacity: number, draw: () => void) {
    this.doc.saveGraphicsState();
    this.doc.setGState(new GState({ opacity }));
    draw();
    this.doc.restoreGraphicsState();
  }
}

function generatedAt(canvas: Canvas): string {
  try {
    return new Intl.DateTimeFormat(pdfLocale(canvas.locale), {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: canvas.timezone,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(),
    );
  }
}

function drawHeader(canvas: Canvas, spec: PdfDocument, stamp: string) {
  const { doc } = canvas;
  const bandHeight = 128;
  canvas.gradient(0, 0, canvas.width, bandHeight);

  // Two soft discs in the corner: decoration, drawn translucent so the band
  // reads as one colour from a distance.
  canvas.withOpacity(0.1, () => {
    canvas.fill(WHITE);
    doc.circle(canvas.width - 70, 20, 90, 'F');
    doc.circle(canvas.width - 170, bandHeight + 10, 60, 'F');
  });

  const left = PAGE_MARGIN;
  canvas.font('bold', 8, mix(WHITE, canvas.accent.to, 0.25));
  doc.setCharSpace(1.6);
  doc.text('FIREFLY STUDIO', left, 34);
  doc.setCharSpace(0);

  // The document type, as a pill beside the brand.
  const badge = spec.kind === 'statement' ? 'STATEMENT' : 'REPORT';
  canvas.font('bold', 7, WHITE);
  doc.setCharSpace(1.2);
  const badgeWidth = doc.getTextWidth(badge) + 16 + badge.length * 1.2;
  canvas.withOpacity(0.22, () => {
    canvas.fill(WHITE);
    doc.roundedRect(left + 96, 24.5, badgeWidth, 14, 7, 7, 'F');
  });
  doc.text(badge, left + 104, 34);
  doc.setCharSpace(0);

  const titleSize = canvas.fitSize(spec.title, canvas.contentWidth - 150, 26, 16);
  canvas.font('bold', titleSize, WHITE);
  doc.text(spec.title, left, 70);

  if (spec.subtitle) {
    canvas.font('normal', 11.5, mix(WHITE, canvas.accent.to, 0.15));
    doc.text(truncate(doc, spec.subtitle, canvas.contentWidth - 150), left, 90);
  }

  if (spec.period) {
    const text = describePeriod(spec.period, canvas.locale, canvas.timezone);
    canvas.font('semibold', 8.5, WHITE);
    const width = doc.getTextWidth(text) + 20;
    canvas.withOpacity(0.18, () => {
      canvas.fill(WHITE);
      doc.roundedRect(left, 101, width, 17, 8.5, 8.5, 'F');
    });
    doc.text(text, left + 10, 112.5);
  }

  // Generated stamp, top right.
  canvas.font('normal', 7.5, mix(WHITE, canvas.accent.to, 0.3));
  doc.text('Generated', canvas.width - PAGE_MARGIN, 34, { align: 'right' });
  canvas.font('semibold', 8.5, WHITE);
  doc.text(stamp, canvas.width - PAGE_MARGIN, 46, { align: 'right' });

  canvas.y = bandHeight + 22;
}

function drawFacts(canvas: Canvas, spec: PdfDocument) {
  const facts = [
    ...(spec.period
      ? [{ label: 'Period', value: describePeriod(spec.period, canvas.locale, canvas.timezone) }]
      : []),
    ...(spec.facts ?? []),
  ].slice(0, 4);
  if (facts.length === 0) return;

  const { doc } = canvas;
  const height = 40;
  canvas.fill(ZEBRA);
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.6);
  doc.roundedRect(PAGE_MARGIN, canvas.y, canvas.contentWidth, height, 6, 6, 'FD');

  const cell = canvas.contentWidth / facts.length;
  facts.forEach((fact, index) => {
    const x = PAGE_MARGIN + index * cell + 14;
    if (index > 0) {
      doc.setDrawColor(...HAIRLINE);
      doc.line(
        PAGE_MARGIN + index * cell,
        canvas.y + 9,
        PAGE_MARGIN + index * cell,
        canvas.y + height - 9,
      );
    }
    canvas.font('semibold', 6.5, MUTED);
    doc.setCharSpace(0.8);
    doc.text(fact.label.toUpperCase(), x, canvas.y + 16);
    doc.setCharSpace(0);
    canvas.font('semibold', 9, INK);
    doc.text(truncate(doc, fact.value, cell - 22), x, canvas.y + 29);
  });
  canvas.y += height + 16;
}

function drawDescription(canvas: Canvas, text: string) {
  canvas.font('normal', 9.5, BODY);
  const lines = canvas.doc.splitTextToSize(text, canvas.contentWidth) as string[];
  canvas.ensure(lines.length * 13 + 8);
  canvas.doc.text(lines, PAGE_MARGIN, canvas.y + 4, { lineHeightFactor: 1.4 });
  canvas.y += lines.length * 13.3 + 12;
}

function drawStats(canvas: Canvas, stats: PdfStat[]) {
  const { doc } = canvas;
  const perRow = Math.min(4, stats.length);
  const gap = 10;
  const width = (canvas.contentWidth - gap * (perRow - 1)) / perRow;
  const height = 66;

  for (let start = 0; start < stats.length; start += perRow) {
    canvas.ensure(height + 10);
    stats.slice(start, start + perRow).forEach((stat, index) => {
      const x = PAGE_MARGIN + index * (width + gap);
      const y = canvas.y;
      const tone =
        (stat.kind ?? 'money') === 'money'
          ? cellTone(stat.tone, stat.value)
          : resolveTone(stat.tone, stat.value);
      const color = tone === 'neutral' ? canvas.accent.ink : toneColor(tone, canvas.accent.ink);

      canvas.fill(mix(color, WHITE, 0.93));
      doc.roundedRect(x, y, width, height, 7, 7, 'F');
      // The accent rule down the left edge carries the tone at a glance.
      canvas.fill(color);
      doc.roundedRect(x, y, 3.5, height, 1.75, 1.75, 'F');

      canvas.font('semibold', 6.8, mix(color, INK, 0.35));
      doc.setCharSpace(0.9);
      doc.text(truncate(doc, stat.label.toUpperCase(), width - 30), x + 14, y + 18);
      doc.setCharSpace(0);

      const value = formatPdfStat(stat, canvas.locale);
      canvas.font('bold', 15, tone === 'neutral' ? INK : color);
      canvas.fitSize(value, width - 24, 15, 8);
      doc.text(value, x + 14, y + 40);

      if (stat.hint) {
        canvas.font('normal', 7.2, MUTED);
        doc.text(truncate(doc, stat.hint, width - 24), x + 14, y + 55);
      }
    });
    canvas.y += height + 10;
  }
  canvas.y += 6;
}

function drawBalance(canvas: Canvas, spec: PdfDocument) {
  const balance = spec.balance;
  if (!balance) return;
  const { doc } = canvas;
  const height = 50;
  canvas.ensure(height + 16);
  const y = canvas.y;

  doc.setDrawColor(...mix(canvas.accent.ink, WHITE, 0.7));
  doc.setLineWidth(0.8);
  canvas.fill(mix(canvas.accent.ink, WHITE, 0.95));
  doc.roundedRect(PAGE_MARGIN, y, canvas.contentWidth, height, 7, 7, 'FD');

  const half = canvas.contentWidth / 2;
  const entries = [
    {
      label: balance.openingLabel ?? 'Opening balance',
      value: balance.opening,
      x: PAGE_MARGIN + 18,
    },
    {
      label: balance.closingLabel ?? 'Closing balance',
      value: balance.closing,
      x: PAGE_MARGIN + half + 30,
    },
  ];
  for (const entry of entries) {
    canvas.font('semibold', 6.8, MUTED);
    doc.setCharSpace(0.9);
    doc.text(entry.label.toUpperCase(), entry.x, y + 19);
    doc.setCharSpace(0);
    const text = `${balance.currency} ${formatMoney(entry.value, {
      locale: pdfLocale(canvas.locale),
      hideSymbol: true,
    })}`;
    canvas.font('bold', 14, toDecimal(entry.value).isNegative() ? TONES.expense : INK);
    doc.text(text, entry.x, y + 38);
  }

  // An arrow between the two figures, in the accent colour.
  const arrowX = PAGE_MARGIN + half;
  doc.setDrawColor(...canvas.accent.ink);
  doc.setLineWidth(1.4);
  doc.line(arrowX - 14, y + height / 2, arrowX + 12, y + height / 2);
  canvas.fill(canvas.accent.ink);
  doc.triangle(
    arrowX + 16,
    y + height / 2,
    arrowX + 9,
    y + height / 2 - 4.5,
    arrowX + 9,
    y + height / 2 + 4.5,
    'F',
  );

  canvas.y += height + 18;
}

function sectionHeading(canvas: Canvas, title?: string, description?: string, reserve = 60) {
  if (!title && !description) return;
  const { doc } = canvas;
  canvas.ensure(reserve + 30);
  if (title) {
    canvas.fill(canvas.accent.ink);
    doc.roundedRect(PAGE_MARGIN, canvas.y - 1, 3, 13, 1.5, 1.5, 'F');
    canvas.font('bold', 12, INK);
    doc.text(title, PAGE_MARGIN + 10, canvas.y + 9.5);
    canvas.y += 16;
  }
  if (description) {
    canvas.font('normal', 8.5, MUTED);
    const lines = doc.splitTextToSize(description, canvas.contentWidth) as string[];
    doc.text(lines, PAGE_MARGIN, canvas.y + 8, { lineHeightFactor: 1.35 });
    canvas.y += lines.length * 11.5 + 4;
  }
  canvas.y += 6;
}

function drawChart(canvas: Canvas, chart: PdfChart) {
  if (chart.rows.length === 0) return;
  const { doc } = canvas;
  const height = 170;
  sectionHeading(canvas, chart.title, chart.description, height);
  canvas.ensure(height + 10);

  const top = canvas.y;
  const axisWidth = 52;
  const plotLeft = PAGE_MARGIN + axisWidth;
  const plotWidth = canvas.contentWidth - axisWidth;
  const plotTop = top + 22;
  const plotHeight = height - 50;

  const colors = chart.series.map((series, index) =>
    series.tone === 'accent-2'
      ? SERIES_EXTRA[0]
      : series.tone === 'accent-3'
        ? SERIES_EXTRA[1]
        : series.tone === 'neutral' || series.tone === 'auto'
          ? canvas.accent.ink
          : (toneColor(series.tone as PdfTone, canvas.accent.ink) ?? SERIES_EXTRA[index % 3]),
  );

  // Heights are a layout concern, not arithmetic on money, so the amounts
  // become numbers here — after every sum has been done on Decimal.
  const values = chart.rows.map((row) =>
    chart.series.map((series) => toDecimal(row[series.key]).toNumber()),
  );
  const flat = values.flat();
  let max = Math.max(0, ...flat);
  let min = Math.min(0, ...flat);
  if (max === min) max = min + 1;
  const pad = (max - min) * 0.08;
  max += max > 0 ? pad : 0;
  min -= min < 0 ? pad : 0;
  const scaleY = (value: number) =>
    plotTop + plotHeight - ((value - min) / (max - min)) * plotHeight;

  // Legend, top right.
  let legendX = PAGE_MARGIN + canvas.contentWidth;
  canvas.font('semibold', 7.5, BODY);
  [...chart.series].reverse().forEach((series, reversedIndex) => {
    const index = chart.series.length - 1 - reversedIndex;
    const width = doc.getTextWidth(series.label);
    legendX -= width;
    doc.text(series.label, legendX, top + 8);
    legendX -= 12;
    canvas.fill(colors[index] ?? canvas.accent.ink);
    doc.roundedRect(legendX, top + 2, 8, 8, 2, 2, 'F');
    legendX -= 14;
  });

  // Grid and axis labels.
  const ticks = 4;
  const compact = { locale: pdfLocale(canvas.locale), hideSymbol: true, compact: true };
  for (let tick = 0; tick <= ticks; tick++) {
    const value = min + ((max - min) * tick) / ticks;
    const y = scaleY(value);
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.5);
    doc.line(plotLeft, y, plotLeft + plotWidth, y);
    canvas.font('normal', 6.8, MUTED);
    doc.text(formatMoney(value, compact), plotLeft - 6, y + 2.3, { align: 'right' });
  }
  if (min < 0) {
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.7);
    doc.line(plotLeft, scaleY(0), plotLeft + plotWidth, scaleY(0));
  }

  const groups = chart.rows.length;
  const slot = plotWidth / groups;
  const labelEvery = Math.ceil(groups / Math.max(1, Math.floor(plotWidth / 46)));
  const asLines = groups > 24;

  if (asLines) {
    chart.series.forEach((_, seriesIndex) => {
      doc.setDrawColor(...(colors[seriesIndex] ?? canvas.accent.ink));
      doc.setLineWidth(1.6);
      doc.setLineJoin('round');
      for (let index = 1; index < groups; index++) {
        doc.line(
          plotLeft + slot * (index - 0.5),
          scaleY(values[index - 1]?.[seriesIndex] ?? 0),
          plotLeft + slot * (index + 0.5),
          scaleY(values[index]?.[seriesIndex] ?? 0),
        );
      }
    });
  } else {
    const inner = slot * 0.72;
    const barWidth = inner / chart.series.length;
    values.forEach((group, index) => {
      group.forEach((value, seriesIndex) => {
        const x = plotLeft + slot * index + (slot - inner) / 2 + barWidth * seriesIndex;
        const y1 = scaleY(Math.max(0, value));
        const y2 = scaleY(Math.min(0, value));
        canvas.fill(colors[seriesIndex] ?? canvas.accent.ink);
        const h = Math.max(0.6, y2 - y1);
        doc.roundedRect(
          x + 0.6,
          y1,
          Math.max(1, barWidth - 1.2),
          h,
          Math.min(2, barWidth / 4),
          Math.min(2, h / 2),
          'F',
        );
      });
    });
  }

  canvas.font('normal', 6.8, MUTED);
  chart.rows.forEach((row, index) => {
    if (index % labelEvery !== 0) return;
    // A chart axis has room for "Sep 22", not "Sep 22, 2026"; the period in
    // the header already says which year.
    const raw = row[chart.labelKey];
    const label =
      chart.labelKind === 'date' && typeof raw === 'string'
        ? formatDate(raw.slice(0, 10), {
            timezone: canvas.timezone,
            locale: pdfLocale(canvas.locale),
            style: 'medium',
          }).replace(/,?\s*\d{4}$/, '')
        : formatPdfCell({ key: chart.labelKey, header: '', kind: chart.labelKind ?? 'text' }, row, {
            locale: canvas.locale,
            timezone: canvas.timezone,
          });
    doc.text(
      truncate(doc, label, slot * labelEvery - 4),
      plotLeft + slot * (index + 0.5),
      plotTop + plotHeight + 12,
      {
        align: 'center',
      },
    );
  });

  canvas.y = top + height + 8;
}

interface CellMeta {
  /** Lines of the description proper; the rest of `text` is the detail line. */
  mainLines?: number;
  detail?: string[];
  bar?: number;
}

function drawTable(canvas: Canvas, table: PdfTable) {
  const { doc } = canvas;
  sectionHeading(canvas, table.title, table.description, 80);

  if (table.rows.length === 0) {
    canvas.ensure(50);
    canvas.fill(ZEBRA);
    doc.roundedRect(PAGE_MARGIN, canvas.y, canvas.contentWidth, 42, 6, 6, 'F');
    canvas.font('normal', 9, MUTED);
    doc.text(
      table.emptyMessage ?? 'Nothing to show for this period.',
      canvas.width / 2,
      canvas.y + 24,
      {
        align: 'center',
      },
    );
    canvas.y += 58;
    return;
  }

  const context = { locale: canvas.locale, timezone: canvas.timezone, currency: table.currency };
  const numeric = (kind?: string) => kind === 'money' || kind === 'count' || kind === 'percent';
  const meta = new Map<string, CellMeta>();

  const body: RowInput[] = table.rows.map((row, rowIndex) =>
    table.columns.map((column, columnIndex) => {
      const text = formatPdfCell(column, row, context);
      const detail = column.detailKey ? row[column.detailKey] : null;
      const tone = column.kind === 'money' ? cellTone(column.tone, row[column.key]) : 'neutral';
      if (column.bar && row[column.key] !== null && row[column.key] !== undefined) {
        meta.set(`${rowIndex}:${columnIndex}`, { bar: toDecimal(row[column.key]).toNumber() });
      }
      if (detail) meta.set(`${rowIndex}:${columnIndex}`, { detail: [String(detail)] });
      return {
        content: detail ? `${text}\n${detail}` : text,
        styles: {
          textColor:
            column.kind === 'money'
              ? toneColor(tone, canvas.accent.ink)
              : column.kind === 'date'
                ? BODY
                : INK,
          fontStyle: (column.kind === 'money' && tone !== 'neutral' && canvas.family !== 'helvetica'
            ? 'semibold'
            : 'normal') as FontStyle,
          // Only set when it differs: a cell-level `cellPadding: undefined`
          // replaces the table's padding with none, which jammed every body
          // cell against its neighbours.
          ...(column.bar ? { cellPadding: { top: 6, bottom: 11, left: 6, right: 6 } } : {}),
          ...(detail ? { cellPadding: { top: 6, bottom: 5, left: 6, right: 6 } } : {}),
        },
      };
    }),
  );

  const { totals, skipped } = columnTotals(table);
  const hasTotals = table.columns.some((column) => column.total);
  const foot: RowInput[] = hasTotals
    ? [
        table.columns.map((column, index) => {
          if (index === 0)
            return { content: table.totalLabel ?? 'Total', styles: { halign: 'left' } };
          if (!column.total) return '';
          const tone =
            column.kind === 'money' ? cellTone(column.tone, totals[column.key]) : 'neutral';
          return {
            content: formatPdfCell(column, totals, { ...context, currency: table.currency }),
            styles: { textColor: toneColor(tone, canvas.accent.ink) },
          };
        }),
      ]
    : [];

  const totalWeight = table.columns.reduce((sum, column) => sum + (column.width ?? 1), 0);
  const columnStyles = Object.fromEntries(
    table.columns.map((column, index) => [
      index,
      {
        halign: numeric(column.kind) ? ('right' as const) : ('left' as const),
        cellWidth: (canvas.contentWidth * (column.width ?? 1)) / totalWeight,
      },
    ]),
  );

  const bodyFont = 8.2;

  autoTable(doc, {
    startY: canvas.y,
    margin: {
      left: PAGE_MARGIN,
      right: PAGE_MARGIN,
      top: RUNNING_HEADER + 16,
      bottom: FOOTER + 14,
    },
    head: [table.columns.map((column) => columnHeader(column, table.currency))],
    body,
    foot,
    showFoot: 'lastPage',
    // A line split across a page break reads as two half-transactions.
    rowPageBreak: 'avoid',
    theme: 'plain',
    styles: {
      font: canvas.family,
      fontSize: bodyFont,
      textColor: INK,
      cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
      lineColor: HAIRLINE,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: canvas.accent.ink,
      textColor: WHITE,
      fontStyle: (canvas.family === 'helvetica' ? 'bold' : 'semibold') as FontStyle,
      fontSize: 7.6,
      cellPadding: { top: 7, bottom: 7, left: 6, right: 6 },
      valign: 'middle',
    },
    footStyles: {
      fillColor: mix(canvas.accent.ink, WHITE, 0.9),
      textColor: INK,
      fontStyle: 'bold',
      fontSize: 8.4,
      cellPadding: { top: 8, bottom: 8, left: 6, right: 6 },
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles,
    didParseCell: (data: CellHookData) => {
      // Header alignment follows the column's, so "Money in" sits over its figures.
      if (data.section === 'head' || data.section === 'foot') {
        const column = table.columns[data.column.index];
        if (
          column &&
          numeric(column.kind) &&
          !(data.section === 'foot' && data.column.index === 0)
        ) {
          data.cell.styles.halign = 'right';
        }
      }
    },
    willDrawCell: (data: CellHookData) => {
      if (data.section !== 'body') return;
      const key = `${data.row.index}:${data.column.index}`;
      const cellMeta = meta.get(key);
      if (cellMeta?.detail) {
        // Split the wrapped text back into the description and its detail, so
        // the detail can be drawn smaller and muted in didDrawCell.
        const mainKey = table.columns[data.column.index]?.key ?? '';
        const main = String(table.rows[data.row.index]?.[mainKey] ?? '');
        doc.setFontSize(bodyFont);
        const width = data.cell.width - data.cell.padding('horizontal');
        const mainLines = (doc.splitTextToSize(main || '—', width) as string[]).length;
        cellMeta.mainLines = mainLines;
        cellMeta.detail = data.cell.text.slice(mainLines);
        data.cell.text = data.cell.text.slice(0, mainLines);
      }
    },
    didDrawCell: (data: CellHookData) => {
      if (data.section === 'foot') {
        // Per cell: a full-width rule drawn from the first cell was painted
        // over by every later cell's background.
        doc.setDrawColor(...canvas.accent.ink);
        doc.setLineWidth(1);
        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
      }
      if (data.section !== 'body') return;
      const cellMeta = meta.get(`${data.row.index}:${data.column.index}`);
      if (cellMeta?.bar !== undefined) {
        // The share bar sits in the cell's bottom padding, below the figure. Drawn
        // AFTER the cell: drawn before, its fill colour leaked into the zebra
        // background and painted whole cells solid.
        const pad = 6;
        const x = data.cell.x + pad;
        const width = data.cell.width - pad * 2;
        const y = data.cell.y + data.cell.height - 8;
        const share = Math.max(0, Math.min(100, cellMeta.bar)) / 100;
        canvas.fill(mix(canvas.accent.ink, WHITE, 0.85));
        doc.roundedRect(x, y, width, 3, 1.5, 1.5, 'F');
        if (share > 0) {
          canvas.fill(canvas.accent.ink);
          doc.roundedRect(x + width * (1 - share), y, Math.max(3, width * share), 3, 1.5, 1.5, 'F');
        }
      }
      if (!cellMeta?.detail || cellMeta.detail.length === 0) return;
      const lineHeight = bodyFont * 1.15;
      const x = data.cell.x + data.cell.padding('left');
      // The row's height was measured with every line at body size, so the
      // detail, drawn smaller from the top of its own slot, always fits inside.
      let y = data.cell.y + data.cell.padding('top') + lineHeight * (cellMeta.mainLines ?? 1) + 0.8;
      canvas.font('normal', 7, MUTED);
      for (const line of cellMeta.detail) {
        doc.text(line, x, y, { baseline: 'top' });
        y += lineHeight;
      }
    },
  });

  const last = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
  canvas.y = (last?.finalY ?? canvas.y) + 10;
  if (skipped > 0) {
    canvas.font('normal', 7.5, MUTED);
    doc.text(
      `Totals are in ${table.currency}; ${skipped} line${skipped === 1 ? '' : 's'} in other currencies ${
        skipped === 1 ? 'is' : 'are'
      } listed but not added.`,
      PAGE_MARGIN,
      canvas.y + 4,
    );
    canvas.y += 12;
  }
  canvas.y += 14;
}

function drawNotes(canvas: Canvas, notes: string[]) {
  if (notes.length === 0) return;
  const { doc } = canvas;
  canvas.font('normal', 7.8, MUTED);
  const blocks = notes.map(
    (note) => doc.splitTextToSize(note, canvas.contentWidth - 18) as string[],
  );
  const height = blocks.reduce((sum, lines) => sum + lines.length * 10.5 + 4, 0) + 30;
  canvas.ensure(height);

  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.6);
  canvas.fill(ZEBRA);
  doc.roundedRect(PAGE_MARGIN, canvas.y, canvas.contentWidth, height, 6, 6, 'FD');
  canvas.font('bold', 7, BODY);
  doc.setCharSpace(0.9);
  doc.text('NOTES', PAGE_MARGIN + 12, canvas.y + 16);
  doc.setCharSpace(0);
  let y = canvas.y + 29;
  canvas.font('normal', 7.8, MUTED);
  for (const lines of blocks) {
    canvas.fill(canvas.accent.ink);
    doc.circle(PAGE_MARGIN + 14, y - 2.6, 1.3, 'F');
    doc.text(lines, PAGE_MARGIN + 20, y, { lineHeightFactor: 1.3 });
    y += lines.length * 10.5 + 4;
  }
  canvas.y += height + 10;
}

/** Running header on every page after the first, and a footer on all of them. */
function drawPageFurniture(canvas: Canvas, spec: PdfDocument, stamp: string) {
  const { doc } = canvas;
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);

    if (page > 1) {
      canvas.gradient(0, 0, canvas.width, 4);
      canvas.font('bold', 9, INK);
      doc.text(spec.title, PAGE_MARGIN, 26);
      const right = spec.period
        ? describePeriod(spec.period, canvas.locale, canvas.timezone)
        : (spec.subtitle ?? '');
      canvas.font('normal', 8, MUTED);
      doc.text(right, canvas.width - PAGE_MARGIN, 26, { align: 'right' });
      doc.setDrawColor(...HAIRLINE);
      doc.setLineWidth(0.6);
      doc.line(PAGE_MARGIN, 34, canvas.width - PAGE_MARGIN, 34);
    }

    const y = canvas.height - 22;
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.6);
    doc.line(PAGE_MARGIN, y - 12, canvas.width - PAGE_MARGIN, y - 12);
    canvas.font('semibold', 7.2, canvas.accent.ink);
    doc.text('Firefly Studio', PAGE_MARGIN, y);
    const brandWidth = doc.getTextWidth('Firefly Studio');
    canvas.font('normal', 7.2, MUTED);
    doc.text(`  ·  ${spec.title}  ·  Generated ${stamp}`, PAGE_MARGIN + brandWidth, y);
    canvas.font('semibold', 7.2, BODY);
    doc.text(`Page ${page} of ${pages}`, canvas.width - PAGE_MARGIN, y, { align: 'right' });
  }
}

/** A table figure's colour. Zero is never red or green: "Over 0.00" is not bad news. */
function cellTone(tone: PdfTone | undefined, value: PdfRow[string]): PdfTone {
  if (value === null || value === undefined || value === '' || toDecimal(value).isZero()) {
    return 'neutral';
  }
  return resolveTone(tone ?? 'neutral', value);
}

function truncate(doc: jsPDF, text: string, width: number): string {
  if (doc.getTextWidth(text) <= width) return text;
  let cut = text;
  while (cut.length > 1 && doc.getTextWidth(`${cut}…`) > width) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Build the document. Exported separately from `downloadPdf` for testing in a browser. */
export async function renderPdf(spec: PdfDocument): Promise<jsPDF> {
  const canvas = new Canvas(spec);
  const fonts = await loadFonts();
  if (fonts) {
    for (const font of fonts) {
      canvas.doc.addFileToVFS(font.file, font.data);
      canvas.doc.addFont(font.file, FONT, font.style);
    }
    canvas.family = FONT;
  }

  canvas.doc.setProperties({
    title: spec.subtitle ? `${spec.title} — ${spec.subtitle}` : spec.title,
    subject: spec.description ?? spec.title,
    creator: 'Firefly Studio',
    author: 'Firefly Studio',
  });

  const stamp = generatedAt(canvas);
  drawHeader(canvas, spec, stamp);
  drawFacts(canvas, spec);
  if (spec.description) drawDescription(canvas, spec.description);
  if (spec.stats && spec.stats.length > 0) drawStats(canvas, spec.stats);
  drawBalance(canvas, spec);
  for (const chart of spec.charts ?? []) drawChart(canvas, chart);
  for (const table of spec.tables) drawTable(canvas, table);
  drawNotes(canvas, spec.notes ?? []);
  drawPageFurniture(canvas, spec, stamp);
  return canvas.doc;
}

export async function downloadPdf(spec: PdfDocument, filename: string): Promise<void> {
  const doc = await renderPdf(spec);
  doc.save(pdfFilename(filename));
}
