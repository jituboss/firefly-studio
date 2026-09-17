import Link from 'next/link';
import { formatDate } from '@/lib/date';
import { Amount } from '@/components/ui/amount';
import type { Transaction } from '@/server/firefly/types';

/**
 * The compact transaction rows used by every resource detail page.
 *
 * M6 needs this in four more places — tag detail, a rule's dry-run results, a
 * recurrence's generated transactions, and linked transactions — so it stops
 * being markup copied per page and becomes one component. The M4 pages still
 * carry their own copy; folding them in is a safe follow-up, but it touches
 * screens this milestone otherwise does not.
 */
export function TransactionList({
  groups,
  timezone,
  empty = 'No transactions in this period.',
}: {
  groups: Transaction[];
  timezone: string;
  empty?: string;
}) {
  if (groups.length === 0) {
    return <p className="text-muted-foreground p-10 text-center text-sm">{empty}</p>;
  }

  return (
    <ul className="divide-border divide-y">
      {groups.map((group) => {
        const split = group.attributes.transactions[0];
        if (!split) return null;
        // A split group shows its first row plus a count, rather than
        // pretending the first line is the whole transaction.
        const extra = group.attributes.transactions.length - 1;
        return (
          <li key={group.id}>
            <Link
              href={`/transactions/${group.id}`}
              className="hover:bg-accent/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {split.description}
                  {extra > 0 ? (
                    <span className="text-muted-foreground font-normal"> +{extra} more</span>
                  ) : null}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {formatDate(split.date.slice(0, 10), { timezone })}
                </p>
              </div>
              <Amount
                value={split.type === 'withdrawal' ? `-${split.amount}` : split.amount}
                currency={split.currency_code}
                decimalPlaces={split.currency_decimal_places}
                tone={split.type === 'transfer' ? 'transfer' : 'auto'}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
