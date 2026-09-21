'use client';

import * as React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Amount } from '@/components/ui/amount';

/**
 * E13-05 — the multi-currency disclosure, and the toggle that answers it.
 *
 * A page holding EUR and GBP used to print the EUR figures and a footnote:
 * "GBP not included". Honest, and useless — the reader wanted one number and
 * got a disclaimer. This offers the converted total instead, on request.
 *
 * **Native stays the default.** A counted figure and an estimated one must not
 * swap places without the reader choosing: the converted number is built from
 * a stored rate with a date on it, and it says so. Anything the rates could not
 * reach is named rather than dropped, because a total that quietly omits a
 * currency is a wrong total wearing the clothes of a right one.
 */
export function CurrencyTotals({
  native,
  converted,
  asOf,
}: {
  native: { currency: string; otherCurrencies: string[] };
  converted: {
    currency: string;
    inflow: string;
    outflow: string;
    net: string;
    converted: string[];
    unconvertible: string[];
  } | null;
  asOf: string | null;
}) {
  const [showConverted, setShowConverted] = React.useState(false);

  // No rates reached these currencies at all: there is nothing to offer, so
  // say what is missing rather than showing a toggle that cannot help.
  if (!converted || converted.converted.length === 0) {
    return <span>{native.otherCurrencies.join(', ')} not included</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConverted((current) => !current)}
        className="hover:text-foreground inline-flex items-center gap-1 underline decoration-dotted underline-offset-2"
      >
        <ArrowLeftRight className="size-3" aria-hidden="true" />
        {showConverted ? 'Show native' : `Convert ${native.otherCurrencies.join(', ')}`}
      </button>

      {showConverted ? (
        <span className="flex items-center gap-x-3">
          <span className="flex items-center gap-1.5">
            All in
            <Amount
              value={converted.net}
              currency={converted.currency}
              className="text-xs font-semibold"
            />
          </span>
          <span>
            estimated{asOf ? `, rates of ${asOf.slice(0, 10)}` : ''}
            {converted.unconvertible.length > 0
              ? ` · ${converted.unconvertible.join(', ')} still not included`
              : ''}
          </span>
        </span>
      ) : (
        <span>{native.otherCurrencies.join(', ')} not included</span>
      )}
    </>
  );
}
