import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { listConnections } from '@/server/connections';
import { getManagedMapping, managedConfig } from '@/server/managed-firefly';
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
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Firefly connections</h1>
        <p className="text-muted-foreground text-sm">
          Your Personal Access Token is encrypted before storage and never sent back to your
          browser. Only the last four characters are shown.
        </p>
      </header>

      {managed ? (
        <ManagedCard
          label={managed.label}
          hasAccount={Boolean(managedMapping)}
          connected={managedConnected}
        />
      ) : null}

      {connections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">No connections yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {connections.map((connection) => (
            <li key={connection.id}>
              <ConnectionCard connection={connection} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
