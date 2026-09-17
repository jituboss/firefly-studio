import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { KeyRound, Monitor, ScrollText } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { getMfaStatus } from '@/server/auth/mfa';
import {
  describeAuditAction,
  describeDevice,
  listActiveSessions,
  listAuditActions,
  listAuditLog,
} from '@/server/auth/security';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteAccountPanel, RevokeOthersButton, RevokeSessionButton } from './security-panels';
import { AuditFilter } from './audit-filter';
import { MfaPanel } from './mfa-panel';
import { renderQrAction } from './qr-action';

export const metadata: Metadata = { title: 'Security' };

/** Show the exact instant, not a relative date: "2 days ago" is not good
 *  enough when you are deciding whether a sign-in was you. */
function timestamp(value: Date, timezone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value);
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const params = await searchParams;
  const action = typeof params.action === 'string' ? params.action : undefined;

  const [activeSessions, entries, actions, mfa] = await Promise.all([
    listActiveSessions(session.user.id, session.sessionId),
    listAuditLog(session.user.id, { limit: 100, action }),
    listAuditActions(session.user.id),
    getMfaStatus(session.user.id),
  ]);

  const { timezone, locale } = session.user;
  const otherCount = activeSessions.filter((entry) => !entry.current).length;

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-muted-foreground text-sm">
          Where you are signed in, what has happened on your account, and how to close it.
        </p>
      </header>

      {/* E2-06 — two-factor authentication */}
      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4 p-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4" aria-hidden="true" />
              Two-factor authentication
            </h2>
            <p className="text-muted-foreground text-xs">
              A code from your phone, on top of your password.
            </p>
          </div>
          <MfaPanel status={mfa} qrFor={renderQrAction} />
        </CardContent>
      </Card>

      {/* E2-08 — active sessions */}
      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <Monitor className="size-4" aria-hidden="true" />
                Active sessions
              </h2>
              <p className="text-muted-foreground text-xs">
                {activeSessions.length} signed in. Revoking takes effect immediately — sessions live
                in the database, not in a token this app cannot recall.
              </p>
            </div>
            {otherCount > 0 ? <RevokeOthersButton otherCount={otherCount} /> : null}
          </div>

          <ul className="divide-border divide-y">
            {activeSessions.map((entry) => (
              <li key={entry.id} className="flex min-w-0 items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {describeDevice(entry.userAgent)}
                    {entry.current ? (
                      <Badge variant="secondary" className="shrink-0">
                        This device
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {entry.ip ?? 'IP unknown'} · last seen{' '}
                    {timestamp(entry.lastSeenAt, timezone, locale)} · signed in{' '}
                    {formatDate(entry.createdAt.toISOString(), { timezone, locale })}
                  </p>
                </div>
                {entry.current ? null : (
                  <RevokeSessionButton
                    sessionId={entry.id}
                    device={describeDevice(entry.userAgent)}
                  />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* E2-09 — audit trail */}
      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <ScrollText className="size-4" aria-hidden="true" />
                Account activity
              </h2>
              <p className="text-muted-foreground text-xs">
                The 100 most recent events on your account, including failed sign-in attempts.
              </p>
            </div>
            {actions.length > 1 ? <AuditFilter actions={actions} selected={action} /> : null}
          </div>

          {entries.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nothing recorded {action ? 'for this event type' : 'yet'}.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {entries.map((entry) => {
                const failed = entry.action.includes('failed');
                return (
                  <li key={entry.id} className="flex min-w-0 items-start gap-3 py-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-1.5 size-1.5 shrink-0 rounded-full',
                        failed ? 'bg-expense' : 'bg-muted-foreground',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm', failed && 'text-expense')}>
                        {describeAuditAction(entry.action)}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {timestamp(entry.createdAt, timezone, locale)}
                        {entry.ip ? ` · ${entry.ip}` : ''}
                        {entry.userAgent ? ` · ${describeDevice(entry.userAgent)}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* E2-10 — danger zone */}
      <Card className="border-expense/40 min-w-0">
        <CardContent className="min-w-0 space-y-3 p-5">
          <div>
            <h2 className="text-expense text-sm font-medium">Danger zone</h2>
            <p className="text-muted-foreground text-xs">
              Closing your Firefly Studio account. Your Firefly III ledger is untouched.
            </p>
          </div>
          <DeleteAccountPanel email={session.user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
