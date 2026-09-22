'use client';

import * as React from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Equal } from 'lucide-react';
import { Amount } from '@/components/ui/amount';
import { cn } from '@/lib/utils';
import { describeMoney } from '@/lib/money';

/**
 * E5-18 — the page totals strip, rebuilt.
 *
 * It used to be one line held open at any width: `whitespace-nowrap` with
 * `overflow-x-auto` around it, on the reasoning that wrapping cost a phone two
 * bands of chrome before the first transaction. What that actually bought was a
 * horizontal scrollbar under the filters and a line clipped at BOTH ends —
 * "ON THIS PAGE" rendering as "AGE" once the strip had scrolled, which is the
 * label that says what the figures are totals OF. A ledger in BDT makes it
 * worse than the design was tested against: "BDT 274,697.29" is half again the
 * width of "€1,234.56", so three of them plus a conversion note is about
 * 1,400px of content in a 700px box.
 *
 * Two things changed.
 *
 * **The figures stack their label above their value and are allowed to wrap.**
 * "In BDT 37,019.52 Out BDT 274,697.29 Net -BDT 237,677.77" reads as one run-on
 * string because the labels sit in the same line as the numbers; lifting them
 * off gives three scannable columns, takes the labels out of the horizontal
 * budget entirely, and lets the row reflow to 2+1 on a narrow phone instead of
 * scrolling. Nothing is ever clipped, which is the whole point.
 *
 * **The prose moved below the figures.** The currency disclosure is a sentence,
 * and a sentence competing for horizontal space with three money values is what
 * made the strip 1,400px wide. On its own line it wraps like a sentence should.
 *
 * And the toggle now does what it says. It used to leave the three native
 * figures in place and append a fourth number — "All in -BDT 237,846.13" —
 * while the button read "Show native", so the control claimed to be showing
 * something it was not. Converting now converts the figures, all three of them,
 * and marks them as estimated.
 */

export interface TotalsFigures {
  currency: string;
  inflow: string;
  outflow: string;
  net: string;
}

export interface ConvertedFigures extends TotalsFigures {
  /** Currencies the stored rates could reach. */
  converted: string[];
  /** Currencies they could not, which stay out of the sum and are named. */
  unconvertible: string[];
}

export interface PageTotalsData {
  /**
   * What the figures are measuring. `account` means the list is filtered to one
   * account, where in and out are relative to THAT account and transfers count
   * — a transfer out of it is money out of it. See `pageTotals`.
   */
  scope?: 'page' | 'account';
  native: TotalsFigures;
  /** Currencies on this page that the native figures do not include. */
  otherCurrencies: string[];
  converted: ConvertedFigures | null;
  asOf: string | null;
}

export function PageTotals({
  scope = 'page',
  native,
  otherCurrencies,
  converted,
  asOf,
  action,
}: PageTotalsData & {
  /**
   * The export control, placed by this component rather than beside it.
   *
   * It has to sit on a different row at each breakpoint. Sharing the tiles' row
   * on a phone left them 72px each and the figures truncated — "274,697...."
   * where the whole point of the tile is the number, and a truncated amount is
   * a wrong amount. It goes on the caption line there, and back beside the
   * tiles from `sm` where there is room for both.
   */
  action?: React.ReactNode;
}) {
  const [showConverted, setShowConverted] = React.useState(false);

  // No rate reached any of them, so there is nothing to offer. The disclosure
  // still has to be made — a total that quietly omits a currency is a wrong
  // total wearing the clothes of a right one — but there is no toggle for it.
  const canConvert = converted !== null && converted.converted.length > 0;
  const estimated = showConverted && canConvert;
  const figures: TotalsFigures = estimated ? converted : native;

  return (
    <div className="min-w-0 flex-1 space-y-1">
      {/*
        The badge is a SIBLING of the list, not a child of it. A `<dl>` may only
        contain `<dt>`, `<dd>` and `<div>` wrappers around them, so a bare
        `<span>` inside it is invalid markup — axe reports `definition-list` at
        serious, and it only appears in the converted state, which is why both
        states get scanned rather than just the one the page opens on.
      */}
      <div className="flex min-w-0 items-stretch gap-2 sm:gap-3">
        {/*
          Three tiles, at every width.

          `grid-cols-3` rather than a wrapping flex row: flex-wrap produced the
          ragged thing this replaced, where "In" and "Out" shared a line and
          "Net" was orphaned below a half-width gap, each column starting at a
          different offset because each hugged its own value. Equal tracks line
          the labels and the figures up at any width.

          The tracks are capped from `sm`. Three equal columns across 850px of
          desktop would strand two figures at opposite ends of the screen, which
          is the opposite of a summary.

          The width does not change when the converted view swaps the numbers —
          fixed tracks, and `Amount` renders tabular numerals — so toggling
          moves nothing on the page but the digits.
        */}
        <dl className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:flex-none sm:grid-cols-[repeat(3,minmax(0,11rem))] sm:gap-3">
          <Figure
            label="In"
            icon={ArrowDownLeft}
            value={figures.inflow}
            currency={figures.currency}
            tone="income"
          />
          <Figure
            label="Out"
            icon={ArrowUpRight}
            value={figures.outflow}
            currency={figures.currency}
            tone="expense"
          />
          <Figure
            label="Net"
            icon={Equal}
            value={figures.net}
            currency={figures.currency}
            tone="auto"
            showSign
          />
        </dl>

        {/*
          Rendered in two places, only ever displayed in one. `hidden` keeps the
          other out of the layout, out of the tab order and out of the
          accessibility tree, which is what makes duplicating it safe — and it
          beats the grid-template-areas gymnastics that placing a single node on
          a different row per breakpoint would otherwise take.
        */}
        {action ? <div className="ml-auto hidden shrink-0 sm:block">{action}</div> : null}
      </div>

      {/*
        The caption, written as sentences rather than as dot-separated chips.

        Middots between clauses cannot wrap cleanly. Bind one to the phrase
        before it and a narrow line can end on a dangling "·"; bind it to the
        phrase after and the next line starts with one. Full stops and commas
        attach to the word in front of them by the ordinary rules of text, so
        prose wraps correctly at any width with no orphan to engineer around.
      */}
      <div className="flex items-start gap-2">
        {/*
          A paragraph of INLINE content, not a flex row of chips.

          As flex items the badge, the sentence and the toggle could not share a
          line: the sentence is one item, so anything beside it was pushed onto
          a line of its own and the block ran to 138px on a phone. Flowing them
          as text lets all three wrap together and fills every line.
        */}
        <p className="text-muted-foreground min-w-0 flex-1 text-xs leading-relaxed">
          {estimated ? (
            <span className="border-border text-foreground/70 mr-1.5 rounded border px-1.5 py-px align-[0.09em] text-[10px] font-medium tracking-wide uppercase">
              Estimated
            </span>
          ) : null}

          {caption({ scope, figures, estimated, converted, otherCurrencies, asOf })}

          {canConvert ? (
            <button
              type="button"
              onClick={() => setShowConverted((current) => !current)}
              className="hover:text-foreground ml-1.5 inline-flex items-center gap-1 align-[-0.1em] underline decoration-dotted underline-offset-2"
            >
              <ArrowLeftRight className="size-3 shrink-0" aria-hidden="true" />
              {estimated ? 'Show native' : `Convert to ${native.currency}`}
            </button>
          ) : null}
        </p>

        {action ? <span className="shrink-0 sm:hidden">{action}</span> : null}
      </div>
    </div>
  );
}

const TONES = {
  /*
   * The `-muted` tints, not an arbitrary alpha.
   *
   * `bg-income/[0.04]` was so faint that axe resolved the effective background
   * as the page's own muted grey, where `text-income` measures 4.45:1 and AA
   * wants 4.5 — failing by a rounding error, and failing the same way the bare
   * figures did before they had tiles at all. The design system already carries
   * a tint per hue that was tuned against its own text colour for exactly this
   * (globals.css: "clearing 4.5:1 on the CARD does not clear it on the TINT"),
   * so the measured pair is the one to use.
   */
  income: 'border-income/30 bg-income-muted',
  expense: 'border-expense/30 bg-expense-muted',
  /*
   * Net takes no side: it is green in a good month and red in a bad one, and
   * tinting it by whichever way this one landed would make the two look like
   * different kinds of figure. It sits on the card colour rather than the page
   * grey because a POSITIVE net is green, which is the pairing that fails on
   * grey — the tile the sign can flip under has to clear contrast both ways.
   */
  auto: 'border-border bg-card',
} as const;

/**
 * One tile: a label with its glyph, and the figure under it.
 *
 * The value carries no currency code — the caption states it once for the row.
 * Three repetitions of "BDT" cost about a third of the horizontal budget on a
 * phone, where the code is nearly as wide as the number beside it, and the
 * currency is a property of the whole row the way a statement says "amounts in
 * BDT" at the top rather than on every line. `describe` puts it back for a
 * screen reader, which has no width to save and would otherwise be read a bare
 * "37,019.52" with no unit at all.
 */
function Figure({
  label,
  icon: Icon,
  value,
  currency,
  tone,
  showSign = false,
}: {
  label: string;
  icon: typeof Equal;
  value: string;
  currency: string;
  tone: keyof typeof TONES;
  showSign?: boolean;
}) {
  return (
    <div className={cn('min-w-0 rounded-lg border px-2.5 py-1.5 sm:px-3 sm:py-2', TONES[tone])}>
      <dt className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase">
        {/* Below `sm` the glyph is 16px of a 98px tile, and the word already
            says which figure this is. */}
        <Icon className="hidden size-3 shrink-0 sm:block" aria-hidden="true" />
        {label}
      </dt>
      <dd className="min-w-0">
        <Amount
          value={value}
          tone={tone}
          showSign={showSign}
          describe={describeMoney(value, currency)}
          // Overrides the size preset's own text-xs from `sm` up. A summary
          // figure earns a size more than the caption under it does, but not at
          // 360px, where three of them at text-sm no longer share a line.
          className="block truncate text-xs font-semibold sm:text-sm"
        />
      </dd>
    </div>
  );
}

/**
 * The sentence under the figures.
 *
 * Every clause here qualifies the numbers above, and every one of them used to
 * sit on the same line as them — which is what made the strip 1,400px wide and
 * put a scrollbar under the filters.
 */
function caption({
  scope,
  figures,
  estimated,
  converted,
  otherCurrencies,
  asOf,
}: {
  scope: 'page' | 'account';
  figures: TotalsFigures;
  estimated: boolean;
  converted: ConvertedFigures | null;
  otherCurrencies: string[];
  asOf: string | null;
}): string {
  const sentences = [
    `On this page, in ${figures.currency}.`,
    /*
     * Transfers are excluded from a whole-ledger total because moving money
     * between your own accounts is neither income nor spending — and counted
     * in an account-scoped one because a transfer out of THIS account is money
     * out of it. The sentence has to say which, or the same two words describe
     * two different sums.
     */
    scope === 'account' ? 'In and out of this account, transfers included.' : 'Transfers excluded.',
  ];

  if (estimated && converted) {
    const without =
      converted.unconvertible.length > 0 ? `, without ${converted.unconvertible.join(', ')}` : '';
    sentences.push(
      // A non-breaking hyphen would be wrong (it is a real hyphen), so the
      // whole date is held together with non-breaking spaces around it — it
      // wrapped as "2025-" / "04-15" otherwise.
      asOf ? `Rates of\u00a0${asOf.slice(0, 10)}${without}.` : `Converted${without}.`,
    );
  } else if (otherCurrencies.length > 0) {
    // Named rather than dropped: a total that quietly omits a currency is a
    // wrong total wearing the clothes of a right one.
    sentences.push(`${otherCurrencies.join(', ')} not included.`);
  }

  return sentences.join(' ');
}
