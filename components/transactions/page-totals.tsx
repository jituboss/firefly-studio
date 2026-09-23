import { ArrowDownLeft, ArrowUpRight, Equal } from 'lucide-react';
import { Amount } from '@/components/ui/amount';
import { cn } from '@/lib/utils';
import { describeMoney } from '@/lib/money';

/**
 * E5-18 — the page totals strip.
 *
 * Three tiles and nothing else. It used to carry a caption under them —
 * "On this page, in BDT. Transfers excluded. USD not included." — and a
 * "Convert to BDT" toggle that swapped the figures for estimates from the
 * stored exchange rates. Both are gone: the strip sits between the filters and
 * the grid, which is the worst place on the page to spend two more rows, and
 * on a phone those two rows pushed the first transaction below the fold.
 *
 * What the caption was carrying still has to be carried, so:
 *
 *   - **The currency moved into the tile labels** ("OUT · BDT"). A bare
 *     "275,081.29" has no unit, and the code is ~30px at this size where the
 *     sentence was a whole line.
 *   - **The scoping — page totals, and which way transfers are counted — moved
 *     into the list's accessible name.** It is a qualifier on the figures, not
 *     a headline, and it never changed while anyone looked at it.
 *   - **A currency the figures leave out is still named**, by the page's own
 *     subtitle rather than here. A total that quietly omits a currency is a
 *     wrong total wearing the clothes of a right one, so that one does not get
 *     to be implicit.
 *
 * The conversion feature is not replaced. `lib/fx.ts` still holds the
 * arithmetic if it earns a home somewhere the space is not this expensive.
 *
 * With the toggle gone there is no state left in here, so it is a plain
 * Server Component rendered straight from the page — one less island of client
 * JavaScript between the filters and the first row.
 */

export interface TotalsFigures {
  currency: string;
  inflow: string;
  outflow: string;
  net: string;
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
}

export function PageTotals({ scope = 'page', native, otherCurrencies }: PageTotalsData) {
  /*
   * Transfers are excluded from a whole-ledger total because moving money
   * between your own accounts is neither income nor spending — and counted in
   * an account-scoped one because a transfer out of THIS account is money out
   * of it. The same two words describe two different sums, so the name has to
   * say which.
   */
  const described =
    scope === 'account'
      ? `In and out of this account on this page, in ${native.currency}, transfers included`
      : `Totals for this page, in ${native.currency}, transfers excluded`;

  const label =
    otherCurrencies.length > 0
      ? `${described}. ${otherCurrencies.join(', ')} not included.`
      : `${described}.`;

  return (
    /*
      Three tiles, at every width.

      `grid-cols-3` rather than a wrapping flex row: flex-wrap produced a ragged
      thing where "In" and "Out" shared a line and "Net" was orphaned below a
      half-width gap, each column starting at a different offset because each
      hugged its own value. Equal tracks line the labels and the figures up at
      any width.

      The tracks are capped from `sm`. Three equal columns across 850px of
      desktop would strand two figures at opposite ends of the screen, which is
      the opposite of a summary.

      Nothing shares this row any more. The export button used to, and at 360px
      that left each tile 72px of content and truncated the figures —
      "274,697...." — where a truncated amount is a wrong amount. It lives on
      the pager line above the table now.
    */
    <dl
      aria-label={label}
      className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-[repeat(3,minmax(0,11rem))] sm:gap-3"
    >
      <Figure
        label="In"
        icon={ArrowDownLeft}
        value={native.inflow}
        currency={native.currency}
        tone="income"
      />
      <Figure
        label="Out"
        icon={ArrowUpRight}
        value={native.outflow}
        currency={native.currency}
        tone="expense"
      />
      <Figure
        label="Net"
        icon={Equal}
        value={native.net}
        currency={native.currency}
        tone="auto"
        showSign
      />
    </dl>
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
 * One tile: a label with its glyph and currency, and the figure under it.
 *
 * The value itself carries no currency code. `Amount` would set it in the same
 * size and weight as the number, where "BDT" is nearly as wide as the figure it
 * qualifies; on the label line it is small, muted and out of the way, the way a
 * statement writes "amounts in BDT" at the top rather than on every line.
 * `describe` puts it back in full for a screen reader, which has no width to
 * save and would otherwise be read a bare "37,019.52" with no unit at all.
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
        <span className="truncate">{label}</span>
        {/* Full `text-muted-foreground`, not a /70 of it. Dimming the code to
            set it apart from the label put it at 3.6:1 on the tinted tiles —
            axe caught it at serious in BOTH themes. The tints were tuned
            against this exact token (globals.css); anything fainter has to be
            re-measured rather than assumed. */}
        <span className="text-muted-foreground truncate font-normal">{currency}</span>
      </dt>
      <dd className="min-w-0">
        <Amount
          value={value}
          tone={tone}
          showSign={showSign}
          describe={describeMoney(value, currency)}
          // Overrides the size preset's own text-xs from `sm` up. A summary
          // figure earns a size more than the label over it does, but not at
          // 360px, where three of them at text-sm no longer share a line.
          className="block truncate text-xs font-semibold sm:text-sm"
        />
      </dd>
    </div>
  );
}
