import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSession } from '@/server/auth/session';
import { getDefaultConnection } from '@/server/connections';
import { FIREFLY_OPERATION_COUNT, FIREFLY_TAGS } from '@/spec/generated/operations';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * M1 state: the connection is live but no financial data is read yet. E3-04
 * onward replace this with real widgets backed by /summary/basic and
 * /chart/balance/balance.
 */

const MILESTONES = [
  { id: 'M0', label: 'Foundation', done: true },
  { id: 'M1', label: 'Auth & onboarding', done: true },
  { id: 'M2', label: 'Read core', done: false },
  { id: 'M3', label: 'Write core', done: false },
  { id: 'M4', label: 'Money management', done: false },
  { id: 'M5', label: 'Reporting', done: false },
  { id: 'M6', label: 'Automation', done: false },
  { id: 'M7', label: 'Polish', done: false },
  { id: 'M8', label: 'Hardening & launch', done: false },
];

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connection = await getDefaultConnection(session.user.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{session.user.displayName ? `, ${session.user.displayName}` : ''}
        </h1>
        <p className="text-muted-foreground text-sm">
          Your Firefly III instance is connected. Financial data arrives in M2.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Connected instance</CardTitle>
          <CardDescription>
            <Link href="/settings/connections" className="underline underline-offset-4">
              Manage connections
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Connection', value: connection?.label ?? '—' },
            { label: 'Firefly III', value: connection?.fireflyVersion ?? '—' },
            { label: 'Firefly account', value: connection?.remoteUserEmail ?? '—' },
            { label: 'Currency', value: connection?.primaryCurrency ?? '—' },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {stat.label}
              </p>
              <p className="mt-1 truncate text-sm font-medium">{stat.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What is next</CardTitle>
            <CardDescription>
              M2 wires the proxy to {FIREFLY_OPERATION_COUNT} operations across{' '}
              {FIREFLY_TAGS.length} resource groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
              <li>Dashboard KPI tiles from /summary/basic</li>
              <li>Account list and balance charts</li>
              <li>The virtualised transaction grid</li>
              <li>Global search</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery progress</CardTitle>
            <CardDescription>Milestones from PROJECT_PLAN.md §6.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {MILESTONES.map((milestone) => (
                <li key={milestone.id} className="flex items-center gap-2.5 text-sm">
                  {milestone.done ? (
                    <CheckCircle2 className="text-income size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleDashed
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className={milestone.done ? '' : 'text-muted-foreground'}>
                    {milestone.label}
                  </span>
                  <Badge variant={milestone.done ? 'income' : 'secondary'} className="ml-auto">
                    {milestone.id}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
