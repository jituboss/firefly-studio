import { ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { describeAuditAction, describeDevice } from '@/lib/audit-labels';
import { AuditFilter } from '@/app/(settings)/settings/security/audit-filter';
import type { AdminAuditEntry } from '@/server/admin';

/**
 * The security trail for the whole instance.
 *
 * The same events the security page shows an account holder about themselves,
 * unscoped. That is the point of it: a failed sign-in against an address that
 * does not exist is invisible on every per-user view, because there is no user
 * to hang it on, and it is the single most useful line in the table when
 * someone is asking whether they are being probed.
 *
 * The filter is the security page's own component, reused rather than copied.
 * It writes `?action=` and nothing else, so it works anywhere the page reads
 * that param — which is the whole reason it was already URL-synced.
 */
export function ActivityPanel({
  entries,
  actions,
  activeAction,
  timezone,
  locale,
}: {
  entries: AdminAuditEntry[];
  actions: string[];
  activeAction?: string;
  timezone: string;
  locale: string;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <ScrollText className="size-4" aria-hidden="true" />
              Activity
            </h2>
            <p className="text-muted-foreground text-xs">
              The {entries.length} most recent events on this deployment, newest first.
            </p>
          </div>
          <AuditFilter actions={actions} selected={activeAction} />
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Nothing recorded yet"
            description={
              activeAction
                ? 'No events of that type. Try a different one.'
                : 'Sign-ins, connection changes and administrative actions appear here.'
            }
          />
        ) : (
          // `relative` for the same reason as the users table: any absolutely
          // positioned descendant (an `sr-only` label, a badge) must be clipped
          // HERE rather than against the viewport.
          <div className="relative min-w-0 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    When
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Account
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Event
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Where
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-b-0">
                    <td className="text-muted-foreground tabular py-2 pr-4 text-xs whitespace-nowrap">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: timezone,
                      }).format(entry.createdAt)}
                    </td>
                    <td className="max-w-[16rem] truncate py-2 pr-4">
                      {/* A dash, not a blank cell: an event with no account is
                          a real event — a sign-in attempt against an address
                          nobody here owns — and an empty cell reads as missing
                          data rather than as the answer. */}
                      {entry.email ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 pr-4">{describeAuditAction(entry.action)}</td>
                    <td className="text-muted-foreground py-2 text-xs">
                      {entry.ip ? <span className="tabular">{entry.ip}</span> : null}
                      {entry.ip && entry.userAgent ? ' · ' : null}
                      {entry.userAgent ? describeDevice(entry.userAgent) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
