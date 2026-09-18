import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { listConnections } from '@/server/connections';
import { getManagedMapping, managedConfig } from '@/server/managed-firefly';
import { Button } from '@/components/ui/button';
import { ConnectionCard } from './connection-card';
import { ManagedCard } from './managed-card';

export const metadata: Metadata = { title: 'Firefly connections' };

export default async function ConnectionsPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const connections = await listConnections(session.user.id);

  const managed = managedConfig();
  const managedMapping = managed ? await getManagedMapping(session.user.id) : null;
  // "Connected" means the DEFAULT connection is the managed account — matched
  // on the remote identity, not just the address. Someone can perfectly well
  // attach the same server with a token of their own, and that is a different
  // ledger; matching on base URL alone reported them as still managed and hid
  // the way back.
  const defaultConnection = connections.find((entry) => entry.isDefault);
  const managedConnected = Boolean(
    managed &&
    managedMapping &&
    defaultConnection &&
    defaultConnection.baseUrl === managed.baseUrl &&
    defaultConnection.remoteUserEmail === managedMapping.remoteEmail,
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Firefly connections</h1>
          <p className="text-muted-foreground text-sm">
            Your Personal Access Token is encrypted before storage and never sent back to your
            browser. Only the last four characters are shown.
          </p>
        </div>
        {/*
          Connection lifecycle fix — the instance switcher only offers "Add
          another instance" once 2+ connections exist, so a user down to one
          (or zero) connection had no way in from here at all.
        */}
        <Button asChild variant="outline" size="sm">
          <Link href="/onboarding?add=1">
            <Plus className="size-4" aria-hidden="true" />
            Add a Firefly instance
          </Link>
        </Button>
      </header>

      {managed ? (
        <ManagedCard
          label={managed.label}
          hasAccount={Boolean(managedMapping)}
          connected={managedConnected}
        />
      ) : null}

      {connections.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">No connections yet.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">
              <Plus className="size-4" aria-hidden="true" />
              Add a Firefly instance
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {connections.map((connection) => (
            <li key={connection.id}>
              <ConnectionCard connection={connection} isOnly={connections.length === 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
