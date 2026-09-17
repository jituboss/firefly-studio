import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { getActiveConnection } from '@/server/firefly/api';
import { DESTROYABLE } from '@/lib/firefly-data';
import { Card, CardContent } from '@/components/ui/card';
import { DangerForm } from './danger-form';
import { ElevateForm } from './elevate-form';

export const metadata: Metadata = { title: 'Danger zone' };

/** E19-01 / E19-03 — export status and irreversible deletion. */
export default async function DangerZonePage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  const connection = await getActiveConnection();
  if (!connection) redirect('/onboarding');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Danger zone</h1>
        <p className="text-muted-foreground text-sm">
          Irreversible operations against the connected Firefly III.
        </p>
      </header>

      {/*
        E19-01/02 — the export centre is not built, and this says so rather than
        offering a button that cannot work. All nine `/data/export/*` endpoints
        answer HTTP 500 on Firefly III 6.5.5 with "Cannot instantiate abstract
        class League\Csv\AbstractCsv" — a broken dependency inside Firefly, not
        something this app can route around. Verified against every one of the
        nine resources.
      */}
      <Card>
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-medium">Exporting your data</p>
          <p className="text-muted-foreground text-sm">
            Firefly III 6.5.5&rsquo;s CSV export endpoints return a server error for every resource,
            so there is nothing useful to put here yet. Export from Firefly III&rsquo;s own
            interface instead, or take a database backup.
          </p>
          <p className="text-muted-foreground text-xs">
            This page will grow an export centre once the upstream endpoints work.
          </p>
        </CardContent>
      </Card>

      <ElevateForm elevated={session.isElevated} />

      <DangerForm options={[...DESTROYABLE]} elevated={session.isElevated} />
    </div>
  );
}
