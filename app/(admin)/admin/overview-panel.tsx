import { CheckCircle2, CircleAlert, Database, Mail, Server, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AdminStats, SystemInfo } from '@/server/admin';

/**
 * What this deployment is, in two cards: who is on it, and what it is running.
 *
 * Every figure is a count of rows in THIS app's database — accounts, sessions,
 * attached Firefly instances. None of it is money, and none of it can be: the
 * only credential that reaches a Firefly instance is the account holder's own
 * sealed token, and nothing on this page unseals one.
 */
export function OverviewPanel({ stats, system }: { stats: AdminStats; system: SystemInfo }) {
  const tiles = [
    {
      label: 'Accounts',
      value: stats.users,
      hint: `${stats.admins} administrator${stats.admins === 1 ? '' : 's'}`,
    },
    {
      label: 'Signed in now',
      value: stats.activeSessions,
      hint: 'Sessions not expired or revoked',
    },
    { label: 'Firefly connections', value: stats.connections, hint: 'Across every account' },
    {
      label: 'Needs attention',
      value: stats.suspended + stats.unverified,
      hint: `${stats.suspended} suspended · ${stats.unverified} unconfirmed`,
    },
  ];

  return (
    <div className="space-y-4">
      <section aria-labelledby="admin-people">
        <h2 id="admin-people" className="sr-only">
          Accounts on this deployment
        </h2>
        {/*
          A `<dl>` PER TILE, not one around the grid.

          `<dl>` may only contain `<dt>`, `<dd>`, or a single `<div>` wrapping a
          pair. Card renders a div and CardContent renders another inside it, so
          a list around the grid puts two levels between the list and its terms
          — axe reports `definition-list` and `dlitem`, both serious, in both
          themes. The totals strip on /transactions gets away with one wrapper
          div for exactly this reason; two is one too many.
        */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <Card key={tile.label} className="min-w-0">
              <CardContent className="min-w-0 p-4">
                <dl className="space-y-0.5">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {tile.label}
                  </dt>
                  <dd className="tabular text-2xl font-semibold">{tile.value.toLocaleString()}</dd>
                  {/* A second `<dd>` for the same term is valid, and the hint
                      IS part of the answer rather than a caption beside it. */}
                  <dd className="text-muted-foreground truncate text-xs">{tile.hint}</dd>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4 p-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Server className="size-4" aria-hidden="true" />
              This deployment
            </h2>
            <p className="text-muted-foreground text-xs">
              Versions, modes and policy flags — the things a support question starts with.
            </p>
          </div>

          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Row label="Version">
              <span className="tabular">{system.version}</span>
              {system.revision !== 'unknown' ? (
                <span className="text-muted-foreground tabular ml-1.5 text-xs">
                  {system.revision.slice(0, 7)}
                </span>
              ) : null}
            </Row>
            <Row label="Environment">{system.environment}</Row>
            <Row label="Node">
              <span className="tabular">{system.nodeVersion}</span>
            </Row>
            <Row label="Minimum Firefly III">
              <span className="tabular">{system.minFireflyVersion}</span>
            </Row>

            <Row label="Database" icon={Database}>
              {system.database === 'reachable' ? (
                <Badge variant="income">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Reachable
                </Badge>
              ) : (
                <Badge variant="expense">
                  <CircleAlert className="size-3" aria-hidden="true" />
                  Unreachable
                </Badge>
              )}
            </Row>
            <Row label="Response cache">
              {system.cache === 'redis' ? (
                <Badge variant="secondary">Redis</Badge>
              ) : (
                /* Not a failure: `REDIS_URL` is optional and the in-memory map
                   is the documented fallback. It IS worth naming, because it
                   is per-process — two app containers behind a load balancer
                   each hold their own, and a write invalidates only one. */
                <Badge variant="warning">In-memory (per process)</Badge>
              )}
            </Row>

            <Row label="Mail" icon={Mail}>
              {system.mailTransport === 'console' ? (
                <Badge variant="warning">Console — links go to the server log</Badge>
              ) : (
                <Badge variant="secondary">{system.mailTransport}</Badge>
              )}
            </Row>
            <Row label="Managed Firefly III" icon={Users}>
              {system.managedFirefly ? (
                <span className="min-w-0 truncate">
                  {system.managedFirefly}
                  <span className="text-muted-foreground ml-1.5 text-xs">
                    {system.managedFireflyUsers} provisioned
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Not configured</span>
              )}
            </Row>

            <Row label="Private networks">
              {/* Both of these widen where this server may be pointed, so they
                  are stated as the exceptions they are rather than as a pair of
                  quiet booleans. */}
              {system.allowPrivateNetworks ? (
                <Badge variant="warning">Allowed</Badge>
              ) : (
                <Badge variant="secondary">Blocked</Badge>
              )}
            </Row>
            <Row label="Insecure HTTP">
              {system.allowInsecureHttp ? (
                <Badge variant="warning">Allowed</Badge>
              ) : (
                <Badge variant="secondary">Blocked</Badge>
              )}
            </Row>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 border-b pb-2 last:border-b-0 sm:border-b-0 sm:pb-0">
      <dt className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}
